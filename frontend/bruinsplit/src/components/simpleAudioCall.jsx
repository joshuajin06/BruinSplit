import { useState, useRef, useEffect } from 'react';
import { Phone, CallEnd, Mic, MicOff } from '@mui/icons-material';
import SimpleCallManager from './utils/simpleCallManager';
import './card.css';

/**
 * Simplified audio call component with clear status indicators
 */
const SimpleAudioCall = ({ 
    rideId, 
    userId, 
    onCallStateChange 
}) => {
    // Call state
    const [isCallActive, setIsCallActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected
    const [error, setError] = useState(null);
    
    // Participants
    const [participants, setParticipants] = useState([]);
    const [connectionStates, setConnectionStates] = useState(new Map()); // userId -> state
    
    // Remote audio streams
    const [remoteStreams, setRemoteStreams] = useState(new Map());
    
    // Refs
    const callManagerRef = useRef(null);
    const audioElementsRef = useRef(new Map()); // userId -> audio element

    /**
     * Start the call
     */
    const handleStartCall = async () => {
        try {
            setError(null);
            setConnectionStatus('connecting');
            
            console.log('🎯 Starting new call...', { rideId, userId });
            
            // Create call manager with callbacks
            callManagerRef.current = new SimpleCallManager(rideId, userId, {
                onRemoteStream: handleRemoteStream,
                onParticipantJoined: handleParticipantJoined,
                onParticipantLeft: handleParticipantLeft,
                onError: handleError,
                onConnectionStateChange: handleConnectionStateChange
            });
            
            // Start the call
            const result = await callManagerRef.current.startCall();
            
            setIsCallActive(true);
            setConnectionStatus('connected');
            setParticipants(result.participants.filter(id => id !== userId));
            
            console.log('✅ Call started successfully');
            
            if (onCallStateChange) {
                onCallStateChange(true, userId);
            }
            
        } catch (err) {
            console.error('❌ Failed to start call:', err);
            setError(err.message || 'Failed to start call');
            setConnectionStatus('disconnected');
            setIsCallActive(false);
            
            // Cleanup on error
            if (callManagerRef.current) {
                await callManagerRef.current.stopCall();
                callManagerRef.current = null;
            }
        }
    };

    /**
     * End the call
     */
    const handleEndCall = async () => {
        try {
            console.log('🛑 Ending call...');
            
            if (callManagerRef.current) {
                await callManagerRef.current.stopCall();
                callManagerRef.current = null;
            }
            
            // Reset state
            setIsCallActive(false);
            setIsMuted(false);
            setConnectionStatus('disconnected');
            setParticipants([]);
            setRemoteStreams(new Map());
            setConnectionStates(new Map());
            setError(null);
            
            // Clear audio elements
            audioElementsRef.current.clear();
            
            console.log('✅ Call ended');
            
            if (onCallStateChange) {
                onCallStateChange(false, userId);
            }
            
        } catch (err) {
            console.error('Error ending call:', err);
            setError('Error ending call');
        }
    };

    /**
     * Toggle mute
     */
    const handleToggleMute = () => {
        if (callManagerRef.current) {
            const newMutedState = callManagerRef.current.toggleMute(isMuted);
            setIsMuted(newMutedState);
        }
    };

    /**
     * Handle remote stream
     */
    const handleRemoteStream = (participantId, stream) => {
        console.log('🎵 Handling remote stream from:', participantId);
        
        setRemoteStreams(prev => {
            const newMap = new Map(prev);
            newMap.set(participantId, stream);
            return newMap;
        });
    };

    /**
     * Handle participant joined
     */
    const handleParticipantJoined = (participantId) => {
        console.log('👋 Participant joined:', participantId);
        
        setParticipants(prev => {
            if (prev.includes(participantId)) return prev;
            return [...prev, participantId];
        });
    };

    /**
     * Handle participant left
     */
    const handleParticipantLeft = (participantId) => {
        console.log('👋 Participant left:', participantId);
        
        setParticipants(prev => prev.filter(id => id !== participantId));
        
        setRemoteStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(participantId);
            return newMap;
        });
        
        setConnectionStates(prev => {
            const newMap = new Map(prev);
            newMap.delete(participantId);
            return newMap;
        });
    };

    /**
     * Handle connection state change
     */
    const handleConnectionStateChange = (participantId, state) => {
        console.log(`🔌 Connection to ${participantId}: ${state}`);
        
        setConnectionStates(prev => {
            const newMap = new Map(prev);
            newMap.set(participantId, state);
            return newMap;
        });
    };

    /**
     * Handle errors
     */
    const handleError = (errorMessage) => {
        console.error('❌ Call error:', errorMessage);
        setError(errorMessage);
    };

    /**
     * Attach audio streams to audio elements
     */
    useEffect(() => {
        remoteStreams.forEach((stream, participantId) => {
            let audioElement = audioElementsRef.current.get(participantId);
            
            if (!audioElement) {
                audioElement = new Audio();
                audioElement.autoplay = true;
                audioElement.volume = 1.0;
                audioElementsRef.current.set(participantId, audioElement);
                console.log(`🔊 Created audio element for ${participantId}`);
            }
            
            if (audioElement.srcObject !== stream) {
                audioElement.srcObject = stream;
                
                audioElement.play()
                    .then(() => {
                        console.log(`✅ Playing audio from ${participantId}`);
                    })
                    .catch(err => {
                        console.error(`❌ Failed to play audio from ${participantId}:`, err);
                    });
            }
        });
        
        // Cleanup removed streams
        audioElementsRef.current.forEach((audioElement, participantId) => {
            if (!remoteStreams.has(participantId)) {
                audioElement.srcObject = null;
                audioElementsRef.current.delete(participantId);
                console.log(`🗑️ Removed audio element for ${participantId}`);
            }
        });
        
    }, [remoteStreams]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (callManagerRef.current && isCallActive) {
                console.log('🧹 Cleaning up on unmount');
                callManagerRef.current.stopCall();
            }
            
            // Stop all audio elements
            audioElementsRef.current.forEach(audioElement => {
                audioElement.srcObject = null;
            });
            audioElementsRef.current.clear();
        };
    }, [isCallActive]);

    /**
     * Get status color
     */
    const getStatusColor = () => {
        if (connectionStatus === 'connected') return '#4CAF50';
        if (connectionStatus === 'connecting') return '#FF9800';
        return '#9E9E9E';
    };

    /**
     * Get status text
     */
    const getStatusText = () => {
        if (connectionStatus === 'connected') {
            if (participants.length === 0) return 'Waiting for others...';
            return `${participants.length} participant${participants.length > 1 ? 's' : ''}`;
        }
        if (connectionStatus === 'connecting') return 'Connecting...';
        return 'Not connected';
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            border: `2px solid ${getStatusColor()}`,
            transition: 'all 0.3s ease'
        }}>
            {/* Call Status Indicator */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '100px'
            }}>
                <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(),
                    marginBottom: '4px',
                    animation: connectionStatus === 'connecting' ? 'pulse 1.5s infinite' : 'none'
                }} />
                <span style={{
                    fontSize: '12px',
                    color: '#666',
                    fontWeight: '500'
                }}>
                    {getStatusText()}
                </span>
            </div>

            {/* Call Controls */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {!isCallActive ? (
                    <button
                        onClick={handleStartCall}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
                    >
                        <Phone fontSize="small" />
                        Start Call
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleToggleMute}
                            style={{
                                padding: '10px',
                                backgroundColor: isMuted ? '#f44336' : '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'background-color 0.2s'
                            }}
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? <MicOff /> : <Mic />}
                        </button>

                        <button
                            onClick={handleEndCall}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#da190b'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#f44336'}
                        >
                            <CallEnd fontSize="small" />
                            End Call
                        </button>
                    </>
                )}
            </div>

            {/* Connection States for Each Participant */}
            {isCallActive && participants.length > 0 && (
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginLeft: 'auto',
                    flexWrap: 'wrap'
                }}>
                    {participants.map(participantId => {
                        const state = connectionStates.get(participantId) || 'new';
                        const hasAudio = remoteStreams.has(participantId);
                        
                        return (
                            <div
                                key={participantId}
                                style={{
                                    padding: '4px 8px',
                                    backgroundColor: hasAudio ? '#e8f5e9' : '#fff3e0',
                                    border: `1px solid ${hasAudio ? '#4CAF50' : '#FF9800'}`,
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    color: '#333'
                                }}
                                title={`User ${participantId.slice(0, 8)}... - ${state}`}
                            >
                                {hasAudio ? '🔊' : '⏳'} {participantId.slice(0, 8)}...
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    right: '0',
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#ffebee',
                    border: '1px solid #f44336',
                    borderRadius: '4px',
                    color: '#c62828',
                    fontSize: '12px'
                }}>
                    {error}
                </div>
            )}

            {/* CSS for pulse animation */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};

export default SimpleAudioCall;
