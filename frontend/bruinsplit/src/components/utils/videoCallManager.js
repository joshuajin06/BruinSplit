import {
    joinCall,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    getCallStatus,
    leaveCall
} from '../../pages/api/calls';
import { RTC_CONFIGURATION, VIDEO_CONSTRAINTS } from '../../config/webrtcConfig';

class VideoCallManager {
    constructor(rideId, userId) {
        this.rideId = rideId;
        this.userId = userId;
        this.localStream = null;
        this.peerConnections = new Map(); // userId -> RTCPeerConnection
        this.remoteStreams = new Map(); // userId -> MediaStream
        this.participants = new Set();
        this.signalingInterval = null;
        this.isCallActive = false;
        this.onRemoteStream = null;
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

            // Get local video/audio stream with optimized constraints
            this.localStream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);

            // Notify backend we're joining
            const response = await joinCall(this.rideId);
            const existingParticipants = response.participants || [];
            this.participants = new Set(existingParticipants);
            this.isCallActive = true;

            // Create connections to existing participants
            const othersInCall = existingParticipants.filter(id => id !== this.userId);
            if (othersInCall.length > 0) {
                for (const participantId of othersInCall) {
                    await this.createPeerConnection(participantId);
                }
            }

            // Start polling for signaling messages
            this.startSignalingLoop();

            return { success: true, participants: Array.from(this.participants), localStream: this.localStream };
        } catch (error) {
            console.error('Error starting video call:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to start video call';
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

            // Add local video/audio tracks
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });

            // Handle incoming remote video/audio
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
                    this.onError?.(`Video connection failed with user ${remoteUserId}`);
                }
            };

            this.peerConnections.set(remoteUserId, peerConnection);

            // Create and send offer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            await sendOffer(this.rideId, remoteUserId, offer);

            return peerConnection;
        } catch (error) {
            this.onError?.(`Failed to connect with participant: ${error.message}`);
            throw error;
        }
    }

    startSignalingLoop() {
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
        }
    }

    async handleOffer(fromUserId, offerObj) {
        try {
            if (!offerObj.offer) return;

            console.log(`📥 Received video offer from ${fromUserId}`);

            let peerConnection = this.peerConnections.get(fromUserId);
            if (!peerConnection) {
                peerConnection = new RTCPeerConnection(RTC_CONFIGURATION);

                console.log(`🔗 Creating video peer connection for incoming offer from ${fromUserId}`);

                // Add local tracks
                this.localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, this.localStream);
                });

                // Handle incoming remote video/audio
                peerConnection.ontrack = (event) => {
                    console.log(`📥 Received ${event.track.kind} track from ${fromUserId}`);
                    this.remoteStreams.set(fromUserId, event.streams[0]);
                    this.onRemoteStream?.(fromUserId, event.streams[0]);
                };

                // Handle ICE candidates
                peerConnection.onicecandidate = (event) => {
                    if (event.candidate) {
                        console.log(`🧊 Video ICE candidate for ${fromUserId}:`, {
                            type: event.candidate.type,
                            protocol: event.candidate.protocol
                        });
                        this.sendIceCandidate(fromUserId, event.candidate);
                    } else {
                        console.log(`✅ Video ICE gathering completed for ${fromUserId}`);
                    }
                };

                // Handle ICE connection state
                peerConnection.oniceconnectionstatechange = () => {
                    console.log(`Video ICE connection state for ${fromUserId}:`, peerConnection.iceConnectionState);

                    if (peerConnection.iceConnectionState === 'failed') {
                        console.warn(`❌ Video ICE connection failed for ${fromUserId}, attempting restart...`);
                        peerConnection.restartIce();
                    } else if (peerConnection.iceConnectionState === 'connected') {
                        console.log(`✅ Video ICE connection established with ${fromUserId}`);
                    }
                };

                // Handle connection state
                peerConnection.onconnectionstatechange = () => {
                    console.log(`Video connection state for ${fromUserId}:`, peerConnection.connectionState);

                    if (peerConnection.connectionState === 'connected') {
                        console.log(`✅ Video peer connection established with ${fromUserId}`);
                    } else if (peerConnection.connectionState === 'failed') {
                        console.error(`❌ Video connection failed with ${fromUserId}`);
                        this.onError?.(`Video connection failed with user ${fromUserId}`);
                    }
                };

                this.peerConnections.set(fromUserId, peerConnection);
            }

            // Set remote description and create answer
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offerObj.offer));

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            await sendAnswer(this.rideId, fromUserId, answer);

            console.log(`📤 Sent video answer to ${fromUserId}`);
        } catch (error) {
            console.error(`Error handling video offer from ${fromUserId}:`, error);
            this.onError?.(`Failed to handle video offer: ${error.message}`);
        }
    }

    async handleAnswer(fromUserId, answerObj) {
        try {
            if (!answerObj.answer) return;

            console.log(`📥 Received video answer from ${fromUserId}`);

            const peerConnection = this.peerConnections.get(fromUserId);
            if (!peerConnection) {
                console.warn(`No peer connection found for ${fromUserId}`);
                return;
            }

            await peerConnection.setRemoteDescription(new RTCSessionDescription(answerObj.answer));
            console.log(`✅ Set remote description for ${fromUserId}`);
        } catch (error) {
            console.error(`Error handling video answer from ${fromUserId}:`, error);
            this.onError?.(`Failed to handle video answer: ${error.message}`);
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

            await peerConnection.addIceCandidate(new RTCIceCandidate(candidateObj.candidate));
        } catch (error) {
            console.error(`Error handling video ICE candidate from ${fromUserId}:`, error);
        }
    }

    async sendIceCandidate(remoteUserId, candidate) {
        try {
            await sendIceCandidate(this.rideId, remoteUserId, candidate);
        } catch (error) {
            console.error(`Error sending video ICE candidate to ${remoteUserId}:`, error);
        }
    }

    toggleCamera(isCameraOn) {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = isCameraOn;
            });
        }
    }

    toggleMic(isMicOn) {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = isMicOn;
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
            console.log('📹 Stopping video call...');

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

            // Stop local video/audio tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    track.stop();
                    console.log(`🛑 Stopped ${track.kind} track`);
                });
                this.localStream = null;
            }

            // Notify backend
            if (this.isCallActive) {
                await leaveCall(this.rideId);
            }

            this.isCallActive = false;
            this.participants.clear();

            console.log('✅ Video call stopped');
        } catch (error) {
            console.error('Error stopping video call:', error);
            this.onError?.(`Error stopping video call: ${error.message}`);
        }
    }

    getParticipants() {
        return Array.from(this.participants).filter(id => id !== this.userId);
    }

    getRemoteStream(userId) {
        return this.remoteStreams.get(userId);
    }

    getLocalStream() {
        return this.localStream;
    }

    isActive() {
        return this.isCallActive;
    }
}

export default VideoCallManager;
