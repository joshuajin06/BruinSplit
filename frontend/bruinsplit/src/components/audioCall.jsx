import { useState, useRef, useEffect } from 'react';
import { Phone, CallEnd, Mic, MicOff } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import CallManager from './utils/callManager';
import './audioCall.css';

const AudioCall = ({ userId, rideId, onCallStateChange }) => {
    const [isCallActive, setIsCallActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [error, setError] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [remoteStreams, setRemoteStreams] = useState(new Map());

    const callManagerRef = useRef(null);
    const remoteAudioRefsRef = useRef(new Map());

    const handleCall = async () => {
        try {
            if (!rideId) {
                setError('Ride ID is required to start a call.');
                return;
            }

            // Initialize CallManager
            callManagerRef.current = new CallManager(rideId, userId);

            // Set up callbacks
            const onRemoteStream = (remoteUserId, stream) => {
                console.log(`🎵 Received audio stream from user ${remoteUserId}`);
                setRemoteStreams(prevStreams => {
                    const newStreams = new Map(prevStreams);
                    newStreams.set(remoteUserId, stream);
                    return newStreams;
                });
            };

            const onParticipantJoined = (participantId) => {
                console.log(`Participant joined: ${participantId}`);
                setParticipants(prevParticipants => {
                    if (!prevParticipants.includes(participantId)) {
                        return [...prevParticipants, participantId];
                    }
                    return prevParticipants;
                });
            };

            const onParticipantLeft = (participantId) => {
                console.log(`Participant left: ${participantId}`);
                setParticipants(prevParticipants =>
                    prevParticipants.filter(id => id !== participantId)
                );
                setRemoteStreams(prevStreams => {
                    const newStreams = new Map(prevStreams);
                    newStreams.delete(participantId);
                    return newStreams;
                });
            };

            const onError = (errorMessage) => {
                console.error('Call error:', errorMessage);
                setError(errorMessage);
            };

            // Start the call with callbacks
            const result = await callManagerRef.current.startCall(
                onRemoteStream,
                onParticipantJoined,
                onParticipantLeft,
                onError
            );

            setIsCallActive(true);
            setError(null);
            setParticipants(result.participants.filter(id => id !== userId));

            if (onCallStateChange) {
                onCallStateChange(true, userId);
            }

        } catch (err) {
            console.error('Error starting call:', err);
            const errorMessage = err.response?.data?.error || err.message || 'Failed to start audio call';
            setError(errorMessage);
            setIsCallActive(false);
        }
    };

    const handleEndCall = async () => {
        try {
            if (callManagerRef.current) {
                await callManagerRef.current.stopCall();
                callManagerRef.current = null;
            }

            // Clear remote streams and audio refs
            remoteAudioRefsRef.current.forEach(audio => {
                audio.srcObject = null;
            });
            remoteAudioRefsRef.current.clear();

            setIsCallActive(false);
            setIsMuted(false);
            setParticipants([]);
            setRemoteStreams(new Map());
            setError(null);

            if (onCallStateChange) {
                onCallStateChange(false, userId);
            }
        } catch (err) {
            console.error('Error ending call:', err);
            setError('Error ending call. Please try again.');
        }
    };

    const toggleMute = () => {
        if (callManagerRef.current) {
            callManagerRef.current.toggleMute(isMuted);
            setIsMuted(!isMuted);
        }
    };

    // Attach audio streams to audio elements when they update
    useEffect(() => {
        console.log('🔄 useEffect triggered. Remote streams count:', remoteStreams.size);
        remoteStreams.forEach((stream, participantId) => {
            const audioElement = remoteAudioRefsRef.current.get(participantId);
            console.log(`📍 Processing stream for participant ${participantId}:`);
            console.log('  - Audio element exists:', !!audioElement);
            console.log('  - Stream:', stream);
            console.log('  - Stream active:', stream?.active);
            console.log('  - Audio tracks:', stream?.getAudioTracks().length);
            
            if (audioElement) {
                console.log('  - Current srcObject:', audioElement.srcObject);
                console.log('  - Volume:', audioElement.volume);
                console.log('  - Muted:', audioElement.muted);
                console.log('  - Paused:', audioElement.paused);
                
                if (audioElement.srcObject !== stream) {
                    console.log(`🔊 Attaching audio stream for user ${participantId}`);
                    audioElement.srcObject = stream;
                    audioElement.volume = 1.0; // Ensure volume is at max
                    audioElement.muted = false; // Ensure not muted
                    
                    // Explicitly play the audio (autoPlay might be blocked)
                    audioElement.play().then(() => {
                        console.log(`✅ Playing audio from user ${participantId}`);
                        console.log('  - Volume after play:', audioElement.volume);
                        console.log('  - Paused after play:', audioElement.paused);
                    }).catch(err => {
                        console.error(`❌ Failed to play audio for ${participantId}:`, err);
                        console.error('  - Error name:', err.name);
                        console.error('  - Error message:', err.message);
                    });
                } else {
                    console.log('  - Stream already attached, checking playback state...');
                    if (audioElement.paused) {
                        console.log('  - Audio is paused, attempting to play...');
                        audioElement.play().catch(err => console.error('Failed to resume:', err));
                    }
                }
            } else {
                console.warn(`⚠️ No audio element found for participant ${participantId}`);
            }
        });
    }, [remoteStreams]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (callManagerRef.current && isCallActive) {
                callManagerRef.current.stopCall().catch(err => {
                    console.error('Error cleaning up call on unmount:', err);
                });
            }
        };
    }, [isCallActive]);

    return (
        <div className="audio-call-button">
            {/* Remote audio elements for each participant */}
            {remoteStreams.size > 0 && (
                <div className="remote-audio-container">
                    {Array.from(remoteStreams.entries()).map(([participantId]) => (
                        <audio
                            key={`audio-${participantId}`}
                            ref={(ref) => {
                                if (ref) {
                                    remoteAudioRefsRef.current.set(participantId, ref);
                                }
                            }}
                            autoPlay
                            playsInline
                        />
                    ))}
                </div>
            )}

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
                            <CallEnd />
                        </IconButton>
                    </Tooltip>
                </div>
            )}

            {/* Participant count during call */}
            {isCallActive && participants.length > 0 && (
                <div className="participants-info">
                    {participants.length} {participants.length === 1 ? 'participant' : 'participants'} on call
                </div>
            )}

            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default AudioCall;