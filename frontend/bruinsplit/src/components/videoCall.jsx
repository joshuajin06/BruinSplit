import { useState, useEffect, useRef } from 'react';
import { Videocam, CallEnd, Mic, MicOff, VideocamOff } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import VideoCallManager from './utils/videoCallManager';
import './videoCall.css';

export default function VideoCall({ userId, rideId }) {
    const [isCallActive, setIsCallActive] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [error, setError] = useState(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [remoteStreams, setRemoteStreams] = useState(new Map());

    const videoCallManagerRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRefsRef = useRef(new Map());

    const startCall = async () => {
        try {
            if (!rideId) {
                setError('Ride ID is required to start a video call.');
                return;
            }

            setError(null);
            console.log('📹 Starting video call for ride:', rideId);

            // Initialize VideoCallManager
            videoCallManagerRef.current = new VideoCallManager(rideId, userId);

            // Set up callbacks
            const onRemoteStream = (remoteUserId, stream) => {
                console.log(`📹 Received remote video stream from ${remoteUserId}`);
                setRemoteStreams(prevStreams => {
                    const newStreams = new Map(prevStreams);
                    newStreams.set(remoteUserId, stream);
                    return newStreams;
                });
            };

            const onParticipantJoined = (participantId) => {
                console.log(`👤 Participant joined: ${participantId}`);
                setParticipants(prevParticipants => {
                    if (!prevParticipants.includes(participantId)) {
                        return [...prevParticipants, participantId];
                    }
                    return prevParticipants;
                });
            };

            const onParticipantLeft = (participantId) => {
                console.log(`👋 Participant left: ${participantId}`);
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
                console.error('Video call error:', errorMessage);
                setError(errorMessage);
            };

            // Start the video call
            const result = await videoCallManagerRef.current.startCall(
                onRemoteStream,
                onParticipantJoined,
                onParticipantLeft,
                onError
            );

            // Set local video stream
            if (localVideoRef.current && result.localStream) {
                localVideoRef.current.srcObject = result.localStream;
            }

            setIsCallActive(true);
            setIsCameraOn(true);
            setIsMicOn(true);
            setError(null);
            setParticipants(result.participants.filter(id => id !== userId));

            console.log('✅ Video call started successfully');
        } catch (err) {
            console.error('Error starting video call:', err);
            const errorMessage = err.response?.data?.error || err.message || 'Failed to start video call';
            setError(errorMessage);
            setIsCallActive(false);
        }
    };

    const endCall = async () => {
        try {
            console.log('📹 Ending video call...');

            if (videoCallManagerRef.current) {
                await videoCallManagerRef.current.stopCall();
                videoCallManagerRef.current = null;
            }

            // Clear local video
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = null;
            }

            // Clear remote videos
            remoteVideoRefsRef.current.forEach(video => {
                video.srcObject = null;
            });
            remoteVideoRefsRef.current.clear();

            setIsCallActive(false);
            setIsCameraOn(true);
            setIsMicOn(true);
            setIsMinimized(false);
            setParticipants([]);
            setRemoteStreams(new Map());
            setError(null);

            console.log('✅ Video call ended');
        } catch (err) {
            console.error('Error ending video call:', err);
            setError('Error ending call. Please try again.');
        }
    };

    const toggleCamera = () => {
        if (videoCallManagerRef.current) {
            const newCameraState = !isCameraOn;
            videoCallManagerRef.current.toggleCamera(newCameraState);
            setIsCameraOn(newCameraState);
        }
    };

    const toggleMic = () => {
        if (videoCallManagerRef.current) {
            const newMicState = !isMicOn;
            videoCallManagerRef.current.toggleMic(newMicState);
            setIsMicOn(newMicState);
        }
    };

    // Attach remote video streams when they update
    useEffect(() => {
        remoteStreams.forEach((stream, participantId) => {
            const videoElement = remoteVideoRefsRef.current.get(participantId);

            if (videoElement) {
                if (videoElement.srcObject !== stream) {
                    videoElement.srcObject = stream;
                    videoElement.muted = false;

                    videoElement.play().catch(err => {
                        console.error(`Failed to play video for ${participantId}:`, err);
                    });
                } else if (videoElement.paused) {
                    videoElement.play().catch(err => console.error('Failed to resume video:', err));
                }
            }
        });
    }, [remoteStreams]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (videoCallManagerRef.current && isCallActive) {
                videoCallManagerRef.current.stopCall().catch(err => {
                    console.error('Error cleaning up video call on unmount:', err);
                });
            }
        };
    }, [isCallActive]);

    if (!isCallActive) {
        return (
            <Tooltip title="Start video call">
                <IconButton
                    onClick={startCall}
                    color="primary"
                    size="large"
                    aria-label="start video call"
                >
                    <Videocam />
                </IconButton>
            </Tooltip>
        );
    }

    return (
    <div className={`video-call-container ${isMinimized ? 'minimized' : ''}`}>
      <div className="video-call-header">
        <span className="video-call-title">Video Call</span>
        <div className="video-call-header-controls">
          <button 
            className="minimize-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? '□' : '_'}
          </button>
          <button 
            className="video-close-btn"
            onClick={endCall}
            title="End call"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="video-display">
            {error && (
              <div className="video-error">
                {error}
              </div>
            )}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="local-video"
            />
            {!isCameraOn && (
              <div className="camera-off-overlay">
                <span className="camera-off-icon">📷</span>
                <p>Camera is off</p>
              </div>
            )}
          </div>

          <div className="video-controls">
            <button
              className={`control-btn ${!isMicOn ? 'off' : ''}`}
              onClick={toggleMic}
              title={isMicOn ? "Mute microphone" : "Unmute microphone"}
            >
              {isMicOn ? '🎤' : '🔇'}
            </button>
            <button
              className={`control-btn ${!isCameraOn ? 'off' : ''}`}
              onClick={toggleCamera}
              title={isCameraOn ? "Turn off camera" : "Turn on camera"}
            >
              {isCameraOn ? '📹' : '📷'}
            </button>
            <button
              className="control-btn end-call-btn"
              onClick={endCall}
              title="End call"
            >
              📞
            </button>
          </div>
        </>
      )}
    </div>
  );
}
