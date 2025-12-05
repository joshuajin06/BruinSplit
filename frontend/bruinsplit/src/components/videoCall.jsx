import { useState, useEffect, useRef } from 'react';
import './VideoCall.css';

export default function VideoCall ({userId, rideId})
{
    const [isCallActive, setIsCallActive] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [error, setError] = useState(null);
    const [isMinimized, setIsMinimized] = useState(false);

}