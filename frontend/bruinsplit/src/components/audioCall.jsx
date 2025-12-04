import { useState, useRef, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import './audioCall.css';

const AudioCall = ({ userId, onCallStateChange }) => {
    const [isCallActive, setIsCallActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [error, setError] = useState(null);
    
    const localStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const remoteAudioRef = useRef(null);

    const handleCall = async () => {
        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }, 
                video: false 
            });
            
            localStreamRef.current = stream;
            setIsCallActive(true);
            setError(null);
            
            // Initialize WebRTC peer connection
            const peerConnection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });
            
            peerConnectionRef.current = peerConnection;
            
            // Add local stream tracks to peer connection
            stream.getTracks().forEach(track => {
                peerConnection.addTrack(track, stream);
            });
            
            // Handle incoming remote stream
            peerConnection.ontrack = (event) => {
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = event.streams[0];
                }
            };
            
            // TODO: Implement signaling server connection here
            // This would involve WebSocket connection to exchange SDP offers/answers
            // and ICE candidates with the other peer
            
            if (onCallStateChange) {
                onCallStateChange(true, userId);
            }
            
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setError('Could not access microphone. Please check permissions.');
            alert('Microphone access denied. Please enable microphone permissions.');
        }
    };

    const handleEndCall = () => {
        // Stop all media tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        
        // Close peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        
        setIsCallActive(false);
        setIsMuted(false);
        
        if (onCallStateChange) {
            onCallStateChange(false, userId);
        }
    };
    
    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
        };
    }, []);

    return (
        <div className="audio-call-button">
            <audio ref={remoteAudioRef} autoPlay />
            
            {!isCallActive ? (
                <Tooltip title="Start audio call">
                    <IconButton 
                        onClick={handleCall}
                        color="primary"
                        size="large"
                        aria-label="start audio call"
                    >
                        <Phone />
                    </IconButton>
                </Tooltip>
            ) : (
                <div className="call-controls">
                    <Tooltip title={isMuted ? "Unmute" : "Mute"}>
                        <IconButton 
                            onClick={toggleMute}
                            color={isMuted ? "warning" : "default"}
                            size="large"
                            aria-label="toggle mute"
                        >
                            {isMuted ? <MicOff /> : <Mic />}
                        </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="End call">
                        <IconButton 
                            onClick={handleEndCall}
                            color="error"
                            size="large"
                            aria-label="end audio call"
                        >
                            <PhoneOff />
                        </IconButton>
                    </Tooltip>
                </div>
            )}
            
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default AudioCall;