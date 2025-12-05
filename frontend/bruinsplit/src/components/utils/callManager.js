import {
    joinCall,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    getCallStatus,
    leaveCall
} from '../../pages/api/calls';
import { RTC_CONFIGURATION, AUDIO_CONSTRAINTS } from '../../config/webrtcConfig';

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
    }
    async startCall(onRemoteStream, onParticipantJoined, onParticipantLeft, onError) {
        try {
            this.onRemoteStream = onRemoteStream;
            this.onParticipantJoined = onParticipantJoined;
            this.onParticipantLeft = onParticipantLeft;
            this.onError = onError;

            // Get local audio stream with optimized constraints
            this.localStream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);

            // Notify backend we're joining
            const response = await joinCall(this.rideId);
            const existingParticipants = response.participants || [];
            this.participants = new Set(existingParticipants);
            this.isCallActive = true;

            // IMPORTANT: Only create offers to users ALREADY in the call
            // New joiners will create offers to us (prevents race condition)
            const othersInCall = existingParticipants.filter(id => id !== this.userId);
            if (othersInCall.length > 0) {
                for (const participantId of othersInCall) {
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
                return this.peerConnections.get(remoteUserId);
            }

            const peerConnection = new RTCPeerConnection(RTC_CONFIGURATION);

            // Add local audio tracks
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });

            // Handle incoming remote audio
            peerConnection.ontrack = (event) => {
                this.remoteStreams.set(remoteUserId, event.streams[0]);
                this.onRemoteStream?.(remoteUserId, event.streams[0]);
            };

            // Handle ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.sendIceCandidate(remoteUserId, event.candidate);
                }
            };

            // Handle ICE connection state changes
            peerConnection.oniceconnectionstatechange = () => {
                if (peerConnection.iceConnectionState === 'failed') {
                    peerConnection.restartIce();
                }
            };

            // Handle connection state changes
            peerConnection.onconnectionstatechange = () => {
                if (peerConnection.connectionState === 'failed') {
                    this.onError?.(`Connection failed with user ${remoteUserId}`);
                }
            };

            this.peerConnections.set(remoteUserId, peerConnection);

            // Create and send offer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
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
                this.stopCall();
                return;
            }

            // Handle new participants
            const currentParticipants = new Set(response.participants || []);
            for (const participantId of currentParticipants) {
                if (!this.participants.has(participantId) && participantId !== this.userId) {
                    this.participants.add(participantId);
                    // CREATE peer connection and send offer to new joiner
                    // (the existing user initiates the connection)
                    await this.createPeerConnection(participantId);
                    this.onParticipantJoined?.(participantId);
                }
            }

            // Check for removed participants
            for (const participantId of this.participants) {
                if (!currentParticipants.has(participantId) && participantId !== this.userId) {
                    this.closePeerConnection(participantId);
                    this.onParticipantLeft?.(participantId);
                }
            }

            // Update the participants list
            this.participants = currentParticipants;

            // Handle incoming offers
            if (response.offers) {
                for (const [fromUserId, offerObj] of Object.entries(response.offers)) {
                    if (offerObj) {
                        await this.handleOffer(fromUserId, offerObj);
                    }
                }
            }

            // Handle incoming answers
            if (response.answers) {
                for (const [fromUserId, answerObj] of Object.entries(response.answers)) {
                    if (answerObj) {
                        await this.handleAnswer(fromUserId, answerObj);
                    }
                }
            }

            // Handle incoming ICE candidates
            if (response.iceCandidates) {
                for (const [fromUserId, candidates] of Object.entries(response.iceCandidates)) {
                    if (Array.isArray(candidates)) {
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
            if (!offerObj.offer) return;

            let peerConnection = this.peerConnections.get(fromUserId);
            if (!peerConnection) {
                // Create peer connection WITHOUT sending an offer back (avoid race condition)
                peerConnection = new RTCPeerConnection(RTC_CONFIGURATION);

                // Add local audio tracks
                this.localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, this.localStream);
                });

                // Handle incoming remote audio
                peerConnection.ontrack = (event) => {
                    this.remoteStreams.set(fromUserId, event.streams[0]);
                    this.onRemoteStream?.(fromUserId, event.streams[0]);
                };

                // Handle ICE candidates
                peerConnection.onicecandidate = (event) => {
                    if (event.candidate) {
                        this.sendIceCandidate(fromUserId, event.candidate);
                    }
                };

                // Handle ICE connection state changes
                peerConnection.oniceconnectionstatechange = () => {
                    if (peerConnection.iceConnectionState === 'failed') {
                        peerConnection.restartIce();
                    }
                };

                // Handle connection state changes
                peerConnection.onconnectionstatechange = () => {
                    if (peerConnection.connectionState === 'failed') {
                        this.onError?.(`Connection failed with user ${fromUserId}`);
                    }
                };

                this.peerConnections.set(fromUserId, peerConnection);
            }

            // Set remote description and create answer
            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(offerObj.offer)
            );

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            // Send answer back
            await sendAnswer(this.rideId, fromUserId, answer);
        } catch (error) {
            console.error(`Error handling offer from ${fromUserId}:`, error);
            this.onError?.(`Failed to handle offer: ${error.message}`);
        }
    }

    /**
     * Handle incoming SDP answer
     */
    async handleAnswer(fromUserId, answerObj) {
        try {
            if (!answerObj.answer) return;

            const peerConnection = this.peerConnections.get(fromUserId);
            if (!peerConnection) {
                console.warn(`No peer connection found for ${fromUserId}`);
                return;
            }

            // Set remote description
            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(answerObj.answer)
            );
        } catch (error) {
            console.error(`Error handling answer from ${fromUserId}:`, error);
            this.onError?.(`Failed to handle answer: ${error.message}`);
        }
    }

    async handleIceCandidate(fromUserId, candidateObj) {
        try {
            if (!candidateObj.candidate) return;

            const peerConnection = this.peerConnections.get(fromUserId);
            if (!peerConnection) {
                console.warn(`No peer connection found for ${fromUserId} to add ICE candidate`);
                return;
            }

            await peerConnection.addIceCandidate(
                new RTCIceCandidate(candidateObj.candidate)
            );
        } catch (error) {
            console.error(`Error handling ICE candidate from ${fromUserId}:`, error);
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

    closePeerConnection(userId) {
        const peerConnection = this.peerConnections.get(userId);
        if (peerConnection) {
            peerConnection.close();
            this.peerConnections.delete(userId);
        }
        this.remoteStreams.delete(userId);
    }

    async stopCall() {
        try {
            // Stop polling
            if (this.signalingInterval) {
                clearInterval(this.signalingInterval);
                this.signalingInterval = null;
            }

            // Close all peer connections
            for (const peerConnection of this.peerConnections.values()) {
                peerConnection.close();
            }
            this.peerConnections.clear();
            this.remoteStreams.clear();

            // Stop local audio tracks
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
