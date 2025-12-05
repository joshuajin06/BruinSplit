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

    const localVideoRef = useRef(null);
    const streamRef = useRef(null);

    // Start Call
    const startCall = async () => {
        try {
        setError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        streamRef.current = stream;
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }
        
        setIsCallActive(true);
        
        } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Failed to access camera/microphone. Please check permissions.');
        }
    };

    useEffect(() => {
    if (localVideoRef.current && streamRef.current) {
      localVideoRef.current.srcObject = streamRef.current;
    }
  }, [isCallActive]);

  // End video call
  const endCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCallActive(false);
    setIsCameraOn(true);
    setIsMicOn(true);
    setIsMinimized(false);
  };

  // Toggle camera
  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  // Toggle microphone
  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (!isCallActive) {
    return (
      <button 
        className="video-call-btn"
        onClick={startCall}
        title="Start video call"
      >
        📹
      </button>
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
