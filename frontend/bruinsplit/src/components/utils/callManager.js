import {
    joinCall,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    getCallStatus,
    leaveCall
} from '../../pages/api/calls';

const STUN_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
];

class CallManager {
    constructor(rideId, userId) {
        this.rideId = rideId;
        this.userId = userId;
        this.localStream = null;
        this.peerConnections = new Map(); // userId -> RTCPeerConnection
        this.remoteStreams = new Map(); // userId -> MediaStream
        this.participants = new Set();
        this.signalingInterval = null;
        this.isCallActive = false;
        this.onRemoteStream = null; // callback when remote audio arrives
        this.onParticipantJoined = null;
        this.onParticipantLeft = null;
        this.onError = null;
        this.pendingIceCandidates = new Map(); // userId -> [candidates]
        this.processedOffers = new Set(); // track processed offers
        this.processedAnswers = new Set(); // track processed answers
    }
    async startCall(onRemoteStream, onParticipantJoined, onParticipantLeft, onError) {
        try {
            this.onRemoteStream = onRemoteStream;
            this.onParticipantJoined = onParticipantJoined;
            this.onParticipantLeft = onParticipantLeft;
            this.onError = onError;

            // Get local media stream (audio + optional video)
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: enableVideo ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                } : false
            };

            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Get local audio stream
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });

            // Notify backend we're joining
            const response = await joinCall(this.rideId);
            this.participants = new Set(response.participants || []);
            this.isCallActive = true;

            // Setup peer connections for each existing participant
            for (const participantId of this.participants) {
                if (participantId !== this.userId) {
                    await this.createPeerConnection(participantId);
                }
            }

            // Start polling for signaling messages
            this.startSignalingLoop();

            return { success: true, participants: Array.from(this.participants) };
        } catch (error) {
            console.error('Error starting call:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to start call';
            this.onError?.(errorMsg);
            throw error;
        }
    }

    async createPeerConnection(remoteUserId) {
        try {
            if (this.peerConnections.has(remoteUserId)) {
                console.log(`Peer connection already exists for ${remoteUserId}`);
                return this.peerConnections.get(remoteUserId);
            }

            console.log(`Creating peer connection to ${remoteUserId}`);
            const peerConnection = new RTCPeerConnection({
                iceServers: STUN_SERVERS
            });

            // Add local audio tracks
            const audioTracks = this.localStream.getAudioTracks();
            console.log(`Adding ${audioTracks.length} audio tracks to peer connection`);
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });

            // Handle incoming remote audio
            peerConnection.ontrack = (event) => {
                console.log('Received remote track from', remoteUserId, 'streams:', event.streams.length);
                this.remoteStreams.set(remoteUserId, event.streams[0]);
                this.onRemoteStream?.(remoteUserId, event.streams[0]);
            };

            // Handle ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log(`ICE candidate from ${remoteUserId}:`, event.candidate.candidate.substring(0, 50));
                    this.sendIceCandidate(remoteUserId, event.candidate);
                }
            };

            // Handle connection state changes
            peerConnection.onconnectionstatechange = () => {
                console.log(`Connection state with ${remoteUserId}:`, peerConnection.connectionState);
                if (peerConnection.connectionState === 'failed') {
                    console.error(`Connection failed with ${remoteUserId}`);
                    this.peerConnections.delete(remoteUserId);
                }
            };

            // Add signaling state logging
            peerConnection.onsignalingstatechange = () => {
                console.log(`Signaling state with ${remoteUserId}:`, peerConnection.signalingState);
            };

            this.peerConnections.set(remoteUserId, peerConnection);

            // Create and send offer
            console.log(`Creating offer for ${remoteUserId}`);
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            console.log(`Sending offer to ${remoteUserId}`);
            await sendOffer(this.rideId, remoteUserId, offer);

            return peerConnection;
        } catch (error) {
            console.error(`Error creating peer connection with ${remoteUserId}:`, error);
            this.onError?.(`Failed to connect with participant: ${error.message}`);
            throw error;
        }
    }

    startSignalingLoop() {
        // Poll every 500ms for signaling messages
        this.signalingInterval = setInterval(() => {
            this.pollSignalingMessages();
        }, 500);
    }
    async pollSignalingMessages() {
        try {
            const response = await getCallStatus(this.rideId);

            if (!response.active) {
                console.log('Call is no longer active');
                this.stopCall();
                return;
            }

            // Handle new participants
            const currentParticipants = new Set(response.participants || []);
            console.log(`Poll: Current participants: ${Array.from(currentParticipants).join(', ')}, My ID: ${this.userId}`);

            for (const participantId of currentParticipants) {
                if (!this.participants.has(participantId) && participantId !== this.userId) {
                    console.log(`New participant detected: ${participantId}`);
                    this.participants.add(participantId);
                    await this.createPeerConnection(participantId);
                    this.onParticipantJoined?.(participantId);
                }
            }

            // Check for removed participants
            for (const participantId of this.participants) {
                if (!currentParticipants.has(participantId) && participantId !== this.userId) {
                    console.log(`Participant left: ${participantId}`);
                    this.closePeerConnection(participantId);
                    this.onParticipantLeft?.(participantId);
                }
            }
            this.participants = currentParticipants;

            // Handle incoming offers
            if (response.offers && Object.keys(response.offers).length > 0) {
                console.log(`Received offers: ${Object.keys(response.offers).join(', ')}`);
                for (const [fromUserId, offerObj] of Object.entries(response.offers)) {
                    if (offerObj) {
                        console.log(`Handling offer from ${fromUserId}`);
                        await this.handleOffer(fromUserId, offerObj);
                    }
                }
            }

            // Handle incoming answers
            if (response.answers && Object.keys(response.answers).length > 0) {
                console.log(`Received answers: ${Object.keys(response.answers).join(', ')}`);
                for (const [fromUserId, answerObj] of Object.entries(response.answers)) {
                    if (answerObj) {
                        console.log(`Handling answer from ${fromUserId}`);
                        await this.handleAnswer(fromUserId, answerObj);
                    }
                }
            }

            // Handle incoming ICE candidates
            if (response.iceCandidates && Object.keys(response.iceCandidates).length > 0) {
                console.log(`Received ICE candidates from: ${Object.keys(response.iceCandidates).join(', ')}`);
                for (const [fromUserId, candidates] of Object.entries(response.iceCandidates)) {
                    if (Array.isArray(candidates)) {
                        console.log(`Adding ${candidates.length} ICE candidates from ${fromUserId}`);
                        for (const candidateObj of candidates) {
                            await this.handleIceCandidate(fromUserId, candidateObj);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error polling signaling messages:', error);
            // Don't stop call on polling error, just log it
        }
    }

    async handleOffer(fromUserId, offerObj) {
        try {
            if (!offerObj.offer) {
                console.warn(`No offer content from ${fromUserId}`);
                return;
            }

            // check if we've already processed this offer 
            const offerKey = `${fromUserId}-${offerObj.timestamp || Date.now()}`;
            if (this.processedOffers.has(offerKey)) {
                console.log(`Already processed offer from ${fromUserId}`);
                return;
            }
            this.processedOffers.add(offerKey);

            console.log(`Handling offer from ${fromUserId}`);
            let peerConnection = this.peerConnections.get(fromUserId);
            if (!peerConnection) {
                console.log(`No existing peer connection for ${fromUserId}, creating one`);
                peerConnection = await this.createPeerConnection(fromUserId);
            }

            // Set remote description and create answer
            console.log(`Setting remote description for ${fromUserId}`);
            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(offerObj.offer)
            );

            // flush any pending ICE candidates
            await this.flushPendingIceCandidates(fromUserId);

            console.log(`Creating answer for ${fromUserId}`);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            console.log(`Sending answer back to ${fromUserId}`);
            // Send answer back
            await sendAnswer(this.rideId, fromUserId, answer);
        } catch (error) {
            console.error(`Error handling offer from ${fromUserId}:`, error);
        }
    }

    /**
     * Handle incoming SDP answer
     */
    async handleAnswer(fromUserId, answerObj) {
        try {
            if (!answerObj.answer) return;

            // check if we've already processed this answer
            const answerKey = `${fromUserId}-${answerObj.timestamp || Date.now()}`;
            if (this.processedAnswers.has(answerKey)) {
                console.log(`Already processed answer from ${fromUserId}`);
                return;
            }
            this.processedAnswers.add(answerKey);

            const peerConnection = this.peerConnections.get(fromUserId);
            if (!peerConnection) {
                console.warn(`No peer connection found for ${fromUserId}`);
                return;
            }

            // Set remote description
            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(answerObj.answer)
            );

            // flush any pending ICE candidates
            await this.flushPendingIceCandidates(fromUserId);

        } catch (error) {
            console.error(`Error handling answer from ${fromUserId}:`, error);
        }
    }

    async handleIceCandidate(fromUserId, candidateObj) {
        try {
            if (!candidateObj.candidate) return;

            const peerConnection = this.peerConnections.get(fromUserId);
            if (!peerConnection) {
                console.warn(`No peer connection found for ${fromUserId} to add ICE candidate`);
                // queue candidate for later
                if (!this.pendingIceCandidates.has(fromUserId)) {
                    this.pendingIceCandidates.set(fromUserId, []);
                }
                this.pendingIceCandidates.get(fromUserId).push(candidateObj);
                return;
            }

            // if remote descripton not set, queue the candidate
            if (peerConnection.remoteDescription === null) {
                if (!this.pendingIceCandidates.has(fromUserId)) {
                    this.pendingIceCandidates.set(fromUserId, []);
                }
                this.pendingIceCandidates.get(fromUserId);
                return;
            }

            await peerConnection.addIceCandidate(
                new RTCIceCandidate(candidateObj.candidate)
            );
        } catch (error) {
            console.error(`Error handling ICE candidate from ${fromUserId}:`, error);
        }
    }

    // add method to flush pending ICE candidates
    async flushPendingIceCandidates(userId) {
        const peerConnection = this.peerConnections.get(userId);
        if (!peerConnection || !this.pendingIceCandidates.has(userId)) {
            return;
        }

        const candidates = this.pendingIceCandidates.get(userId);
        if (candidates.length === 0) return;

        // only flush if remote description is set
        if (peerConnection.remoteDescription) {
            for (const candidateObj of candidates) {
                try {
                    await peerConnection.addIceCandidate(
                        new RTCIceCandidate(candidateObj.candidate)
                    );
                } catch (error) {
                    console.error('Error adding queued ICE candidates:', error);
                }
            }
            this.pendingIceCandidates.delete(userId);
        }
    }

    async sendIceCandidate(remoteUserId, candidate) {
        try {
            await sendIceCandidate(this.rideId, remoteUserId, candidate);
        } catch (error) {
            console.error(`Error sending ICE candidate to ${remoteUserId}:`, error);
        }
    }

    toggleMute(isMuted) {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
    }

    async toggleVideo(enable) {
        if (!this.localStream) return;

        const videoTracks = this.localStream.getVideoTracks();
        if (videoTracks.length > 0) {
            videoTracks.forEach(track => {
                track.enabled = enable;
            });
        } else if (enable) {
            // add video track if it doesn't exist
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'user'
                    }
                });
                const videoTrack = videoStream.getVideoTracks()[0];
                this.localStream.addTrack(videoTrack);

                // add video track to all existing peer connections
                this.peerConnections.forEach((peerConnections) => {
                    peerConnections.addTrack(videoTrack, this.localStream);
                });

            } catch (error) {
                console.error('Error enabling video:', error);
                throw error;
            }
        }
    }

    getLocalStream() {
        return this.localStream;
    }

    closePeerConnection(userId) {
        const peerConnection = this.peerConnections.get(userId);
        if (peerConnection) {
            // close all tracks first
            peerConnection.getSenders().forEach(sender => {
                if (sender.track) {
                    sender.track.stop();
                }
            });
            peerConnection.close();
            this.peerConnections.delete(userId);
        }
        this.remoteStreams.delete(userId);
        this.pendingIceCandidates.delete(userId);
    }

    async stopCall() {
        try {
            // Stop polling
            if (this.signalingInterval) {
                clearInterval(this.signalingInterval);
                this.signalingInterval = null;
            }

            // close all peer connections
            for (const [userId, peerConnection] of this.peerConnections.entries()) {
                peerConnection.getSenders().forEach(sender => {
                    if (sender.track) {
                        sender.track.stop();
                    }
                });
                peerConnection.close();
            }
            this.peerConnections.clear();
            this.remoteStreams.clear();
            this.pendingIceCandidates.clear();
            this.processedOffers.clear();
            this.processedAnswers.clear();

            // Stop local media tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
                this.localStream = null;
            }

            // Notify backend
            if (this.isCallActive) {
                await leaveCall(this.rideId);
            }

            this.isCallActive = false;
            this.participants.clear();
            
        } catch (error) {
            console.error('Error stopping call:', error);
            this.onError?.(`Error stopping call: ${error.message}`);
        }
    }

    getParticipants() {
        return Array.from(this.participants).filter(id => id !== this.userId);
    }

    getRemoteStream(userId) {
        return this.remoteStreams.get(userId);
    }

    isActive() {
        return this.isCallActive;
    }
}

export default CallManager;
