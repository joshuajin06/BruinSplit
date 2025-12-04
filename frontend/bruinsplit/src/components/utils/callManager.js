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
    }
    async startCall(onRemoteStream, onParticipantJoined, onParticipantLeft, onError) {
        try {
            this.onRemoteStream = onRemoteStream;
            this.onParticipantJoined = onParticipantJoined;
            this.onParticipantLeft = onParticipantLeft;
            this.onError = onError;

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
                return this.peerConnections.get(remoteUserId);
            }

            const peerConnection = new RTCPeerConnection({
                iceServers: STUN_SERVERS
            });

            // Add local audio tracks
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });

            // Handle incoming remote audio
            peerConnection.ontrack = (event) => {
                console.log('Received remote track from', remoteUserId);
                this.remoteStreams.set(remoteUserId, event.streams[0]);
                this.onRemoteStream?.(remoteUserId, event.streams[0]);
            };

            // Handle ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
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

    
}

export default CallManager;
