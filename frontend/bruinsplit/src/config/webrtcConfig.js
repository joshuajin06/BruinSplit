/**
 * WebRTC Configuration with STUN and TURN servers
 *
 * STUN servers help discover public IP addresses for NAT traversal
 * TURN servers relay traffic when direct P2P connection fails (e.g., restrictive firewalls like UCLA WiFi)
 */

export const ICE_SERVERS = [
    // Google's public STUN servers - free and reliable
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },

    // OpenRelay public TURN servers - for when STUN isn't enough
    {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    },
    {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    },
    {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    },

    // Additional free TURN servers
    {
        urls: 'turn:relay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    },
    {
        urls: 'turn:relay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    }
];

/**
 * RTCPeerConnection configuration
 */
export const RTC_CONFIGURATION = {
    iceServers: ICE_SERVERS,

    // Increase ICE candidate pool size for better connectivity
    iceCandidatePoolSize: 10,

    // Try all candidates (relay, srflx, host)
    iceTransportPolicy: 'all',

    // Bundle policy for media
    bundlePolicy: 'max-bundle',

    // RTCP mux policy
    rtcpMuxPolicy: 'require'
};

/**
 * Media constraints for audio calls
 */
export const AUDIO_CONSTRAINTS = {
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1
    },
    video: false
};

/**
 * Media constraints for video calls
 */
export const VIDEO_CONSTRAINTS = {
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000
    },
    video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 30 },
        facingMode: 'user'
    }
};

/**
 * Data channel configuration
 */
export const DATA_CHANNEL_CONFIG = {
    ordered: true,
    maxRetransmits: 10
};

export default {
    ICE_SERVERS,
    RTC_CONFIGURATION,
    AUDIO_CONSTRAINTS,
    VIDEO_CONSTRAINTS,
    DATA_CHANNEL_CONFIG
};
