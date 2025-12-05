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
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
];

const ICE_CONFIG = {
    iceServers: STUN_SERVERS,
    iceCandidatePoolSize: 10
};

const SIGNALING_POLL_INTERVAL = 1000; // 1 second

/**
 * Simplified CallManager for peer-to-peer audio calls
 * Handles WebRTC connections with clear state management
 */
class SimpleCallManager {
    constructor(rideId, userId, callbacks = {}) {
        this.rideId = rideId;
        this.userId = userId;
        
        // Media streams
        this.localStream = null;
        this.remoteStreams = new Map(); // userId -> MediaStream
        
        // WebRTC connections
        this.peerConnections = new Map(); // userId -> RTCPeerConnection
        this.connectionStates = new Map(); // userId -> state string
        
        // Participants
        this.participants = new Set();
        
        // Signaling
        this.signalingInterval = null;
        this.isCallActive = false;
        
        // Callbacks
        this.callbacks = {
            onRemoteStream: callbacks.onRemoteStream || null,
            onParticipantJoined: callbacks.onParticipantJoined || null,
            onParticipantLeft: callbacks.onParticipantLeft || null,
            onError: callbacks.onError || null,
            onConnectionStateChange: callbacks.onConnectionStateChange || null
        };
        
        console.log('📞 SimpleCallManager created:', { rideId, userId });
    }

    /**
     * Start the audio call
     */
    async startCall() {
        try {
            console.log('🚀 Starting call...');
            
            // Get microphone access
            await this._getMicrophoneAccess();
            
            // Join the call on backend
            const { participants } = await this._joinBackendCall();
            
            // Start signaling loop
            this._startSignaling();
            
            // Create peer connections for existing participants
            const others = participants.filter(id => id !== this.userId);
            if (others.length > 0) {
                console.log(`👥 Creating connections to ${others.length} participant(s)`);
                for (const userId of others) {
                    await this._createPeerConnection(userId, true); // We initiate
                }
            } else {
                console.log('⏳ Waiting for other participants...');
            }
            
            this.isCallActive = true;
            return { success: true, participants: Array.from(this.participants) };
            
        } catch (error) {
            console.error('❌ Error starting call:', error);
            const message = error.response?.data?.error || error.message || 'Failed to start call';
            this.callbacks.onError?.(`Connection failed: ${message}`);
            await this.stopCall();
            throw error;
        }
    }

    /**
     * Stop the audio call and cleanup
     */
    async stopCall() {
        try {
            console.log('🛑 Stopping call...');
            
            // Stop signaling
            if (this.signalingInterval) {
                clearInterval(this.signalingInterval);
                this.signalingInterval = null;
            }
            
            // Close all peer connections
            for (const [userId, pc] of this.peerConnections.entries()) {
                console.log(`Closing connection to ${userId}`);
                pc.close();
            }
            this.peerConnections.clear();
            this.connectionStates.clear();
            
            // Stop local stream
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    track.stop();
                    console.log('Stopped local track:', track.kind);
                });
                this.localStream = null;
            }
            
            // Clear remote streams
            this.remoteStreams.clear();
            
            // Notify backend
            if (this.isCallActive) {
                try {
                    await leaveCall(this.rideId);
                    console.log('✅ Left call on backend');
                } catch (error) {
                    console.error('Error leaving call on backend:', error);
                }
            }
            
            this.isCallActive = false;
            this.participants.clear();
            
            console.log('✅ Call stopped successfully');
            
        } catch (error) {
            console.error('Error stopping call:', error);
        }
    }

    /**
     * Toggle mute state
     */
    toggleMute(currentMuted) {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = currentMuted; // If currently muted, enable it
                console.log(`🎤 Microphone ${currentMuted ? 'unmuted' : 'muted'}`);
                return !currentMuted;
            }
        }
        return currentMuted;
    }

    /**
     * Get microphone access
     */
    async _getMicrophoneAccess() {
        console.log('🎤 Requesting microphone access...');
        
        this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            },
            video: false
        });
        
        const audioTrack = this.localStream.getAudioTracks()[0];
        console.log('✅ Microphone access granted:', {
            label: audioTrack.label,
            enabled: audioTrack.enabled,
            readyState: audioTrack.readyState
        });
    }

    /**
     * Join call on backend
     */
    async _joinBackendCall() {
        console.log('📡 Joining call on backend...');
        
        const response = await joinCall(this.rideId);
        const participants = response.participants || [];
        
        this.participants = new Set(participants);
        
        console.log('✅ Joined backend call:', {
            rideId: this.rideId,
            myUserId: this.userId,
            participants: participants,
            others: participants.filter(id => id !== this.userId)
        });
        
        return { participants };
    }

    /**
     * Start signaling loop
     */
    _startSignaling() {
        console.log('🔄 Starting signaling loop...');
        
        this.signalingInterval = setInterval(async () => {
            await this._pollSignaling();
        }, SIGNALING_POLL_INTERVAL);
    }

    /**
     * Poll for signaling messages
     */
    async _pollSignaling() {
        try {
            const response = await getCallStatus(this.rideId);
            
            // Check if call is still active
            if (!response.active) {
                console.log('⚠️ Call no longer active on backend');
                await this.stopCall();
                return;
            }
            
            // Check for new participants
            const currentParticipants = new Set(response.participants || []);
            const newParticipants = [...currentParticipants].filter(
                id => id !== this.userId && !this.participants.has(id)
            );
            
            if (newParticipants.length > 0) {
                console.log('👋 New participant(s) joined:', newParticipants);
                newParticipants.forEach(id => {
                    this.participants.add(id);
                    this.callbacks.onParticipantJoined?.(id);
                });
            }
            
            // Check for left participants
            const leftParticipants = [...this.participants].filter(
                id => id !== this.userId && !currentParticipants.has(id)
            );
            
            if (leftParticipants.length > 0) {
                console.log('👋 Participant(s) left:', leftParticipants);
                leftParticipants.forEach(id => {
                    this.participants.delete(id);
                    this._removePeerConnection(id);
                    this.callbacks.onParticipantLeft?.(id);
                });
            }
            
            // Process signaling messages
            await this._processSignalingMessages(response);
            
        } catch (error) {
            console.error('Error polling signaling:', error);
        }
    }

    /**
     * Process signaling messages (offers, answers, ICE candidates)
     */
    async _processSignalingMessages(response) {
        // Process offers
        if (response.offers) {
            for (const [fromUserId, offer] of Object.entries(response.offers)) {
                if (!this.peerConnections.has(fromUserId)) {
                    console.log(`📩 Received offer from ${fromUserId}`);
                    await this._handleOffer(fromUserId, offer);
                }
            }
        }
        
        // Process answers
        if (response.answers) {
            for (const [fromUserId, answer] of Object.entries(response.answers)) {
                console.log(`📩 Received answer from ${fromUserId}`);
                await this._handleAnswer(fromUserId, answer);
            }
        }
        
        // Process ICE candidates
        if (response.iceCandidates) {
            for (const [fromUserId, candidates] of Object.entries(response.iceCandidates)) {
                if (Array.isArray(candidates)) {
                    for (const candidate of candidates) {
                        await this._handleIceCandidate(fromUserId, candidate);
                    }
                }
            }
        }
    }

    /**
     * Create a peer connection
     */
    async _createPeerConnection(remoteUserId, createOffer = false) {
        try {
            if (this.peerConnections.has(remoteUserId)) {
                console.log(`⚠️ Peer connection to ${remoteUserId} already exists`);
                return this.peerConnections.get(remoteUserId);
            }
            
            console.log(`🔌 Creating peer connection to ${remoteUserId}`);
            
            const pc = new RTCPeerConnection(ICE_CONFIG);
            
            // Add local audio tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    pc.addTrack(track, this.localStream);
                    console.log(`➕ Added local ${track.kind} track to connection`);
                });
            }
            
            // Handle incoming tracks
            pc.ontrack = (event) => {
                console.log(`🎵 Received remote track from ${remoteUserId}:`, event.track.kind);
                
                const stream = event.streams[0];
                this.remoteStreams.set(remoteUserId, stream);
                this.callbacks.onRemoteStream?.(remoteUserId, stream);
                
                // Log track details
                const audioTrack = stream.getAudioTracks()[0];
                if (audioTrack) {
                    console.log('  Track details:', {
                        enabled: audioTrack.enabled,
                        muted: audioTrack.muted,
                        readyState: audioTrack.readyState
                    });
                }
            };
            
            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log(`🧊 Sending ICE candidate to ${remoteUserId}`);
                    this._sendIceCandidate(remoteUserId, event.candidate);
                }
            };
            
            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                const state = pc.connectionState;
                console.log(`🔌 Connection to ${remoteUserId}: ${state}`);
                this.connectionStates.set(remoteUserId, state);
                this.callbacks.onConnectionStateChange?.(remoteUserId, state);
                
                if (state === 'failed' || state === 'closed') {
                    console.log(`❌ Connection to ${remoteUserId} ${state}`);
                    this._removePeerConnection(remoteUserId);
                }
            };
            
            // Handle ICE connection state changes
            pc.oniceconnectionstatechange = () => {
                console.log(`🧊 ICE connection to ${remoteUserId}: ${pc.iceConnectionState}`);
            };
            
            this.peerConnections.set(remoteUserId, pc);
            
            // Create and send offer if we're the initiator
            if (createOffer) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                await sendOffer(this.rideId, remoteUserId, offer);
                console.log(`📤 Sent offer to ${remoteUserId}`);
            }
            
            return pc;
            
        } catch (error) {
            console.error(`Error creating peer connection to ${remoteUserId}:`, error);
            throw error;
        }
    }

    /**
     * Handle incoming offer
     */
    async _handleOffer(fromUserId, offer) {
        try {
            console.log(`📥 Processing offer from ${fromUserId}`);
            
            const pc = await this._createPeerConnection(fromUserId, false);
            
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            await sendAnswer(this.rideId, fromUserId, answer);
            console.log(`📤 Sent answer to ${fromUserId}`);
            
        } catch (error) {
            console.error(`Error handling offer from ${fromUserId}:`, error);
        }
    }

    /**
     * Handle incoming answer
     */
    async _handleAnswer(fromUserId, answer) {
        try {
            const pc = this.peerConnections.get(fromUserId);
            if (!pc) {
                console.warn(`No peer connection for ${fromUserId}, ignoring answer`);
                return;
            }
            
            console.log(`📥 Processing answer from ${fromUserId}`);
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            
        } catch (error) {
            console.error(`Error handling answer from ${fromUserId}:`, error);
        }
    }

    /**
     * Handle incoming ICE candidate
     */
    async _handleIceCandidate(fromUserId, candidate) {
        try {
            const pc = this.peerConnections.get(fromUserId);
            if (!pc) {
                console.warn(`No peer connection for ${fromUserId}, ignoring ICE candidate`);
                return;
            }
            
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            
        } catch (error) {
            console.error(`Error handling ICE candidate from ${fromUserId}:`, error);
        }
    }

    /**
     * Send ICE candidate
     */
    async _sendIceCandidate(remoteUserId, candidate) {
        try {
            await sendIceCandidate(this.rideId, remoteUserId, candidate);
        } catch (error) {
            console.error(`Error sending ICE candidate to ${remoteUserId}:`, error);
        }
    }

    /**
     * Remove peer connection
     */
    _removePeerConnection(userId) {
        const pc = this.peerConnections.get(userId);
        if (pc) {
            pc.close();
            this.peerConnections.delete(userId);
        }
        
        this.remoteStreams.delete(userId);
        this.connectionStates.delete(userId);
        
        console.log(`🗑️ Removed peer connection to ${userId}`);
    }
}

export default SimpleCallManager;
