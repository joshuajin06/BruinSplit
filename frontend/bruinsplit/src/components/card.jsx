import React, { useState } from 'react';
import "./card.css"

const DEFAULT_RIDE_IMAGE = "https://wp.dailybruin.com/images/2021/11/web.news_.globalranking2021.ND_.jpg";

export default function Card({ title, origin, destination, content, image, rideDetails, departureDatetime, platform, notes, maxRiders, createdAt, rideId, onJoin }) {
    //initial modal states
    const [showModal, setShowModal] = useState(false);
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState(null);

    // isMember can be: true (user is member), false (not member)
    // If the parent doesn't provide `isMember` (undefined), treat as unknown and
    // avoid overwriting local state after a local join/leave action.
    const initialIsMember = typeof rideDetails?.isMember === 'boolean' ? rideDetails.isMember : null;
    const [isMember, setIsMember] = useState(initialIsMember);

    //tab and rider state
    const [activeTab, setActiveTab] = useState('details'); // 'details' | 'riders'
    const [riders, setRiders] = useState([]);
    const [loadingRiders, setLoadingRiders] = useState(false);
    const [ridersError, setRidersError] = useState(null);

// Fetch riders function
    const fetchRiders = async () => {
        if (!rideId) return;
        
        setLoadingRiders(true);
        setRidersError(null);
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setRidersError('Authentication required');
                return;
            }

            const res = await fetch(`/api/rides/${rideId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error('Failed to load riders');
            
            const data = await res.json();
            
            // Debug: Log the response to see what we're getting
            console.log('Ride data:', data);
            console.log('Members:', data?.ride?.members);
            
            // Handle the response structure
            const members = data?.ride?.members || [];
            
            // If members don't have profile info, we need to handle it differently
            // Check if first member has profile property
            if (members.length > 0 && !members[0].profile) {
                console.warn('Members missing profile data - backend needs to return membersWithProfiles');
            }
            
            setRiders(members);
        } catch (err) {
            console.error('Fetch riders error:', err);
            setRidersError(err.message || 'Failed to load riders');
        } finally {
            setLoadingRiders(false);
        }
    };

    React.useEffect(() => {
        if (typeof rideDetails?.isMember === 'boolean') {
            setIsMember(rideDetails.isMember);
        }
        // if parent did not provide a boolean isMember, do not overwrite local state
    }, [rideDetails?.isMember]);

    const handleCancel = () =>
    {
        setShowModal(false);
        setJoinError(null);
        setActiveTab('details');
    }

    const handleConfirmJoin = async () => {
        const displayTitle = origin && destination ? `${origin} to ${destination}` : title;
        setJoining(true);
        setJoinError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('User not authenticated');

            if (!rideId) throw new Error('Ride id is missing');

            const res = await fetch(`/api/rides/${rideId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error?.message || data?.error || data?.message || 'Failed to join ride');

            // update local state and notify parent to refresh
            setIsMember(true);
            if (onJoin) await onJoin(rideId);

            alert(`Joined: ${displayTitle}`);
            setShowModal(false);
        } catch (err) {
            setJoinError(err.message || 'Error joining ride');
        } finally {
            setJoining(false);
        }
    };

    const handleConfirmLeave = async () => {
        setJoining(true);
        setJoinError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('User not authenticated');
            if (!rideId) throw new Error('Ride id is missing');

            const res = await fetch(`/api/rides/${rideId}/leave`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || data?.message || 'Failed to leave ride');

            // update local state and notify parent to refresh
            setIsMember(false);
            if (onJoin) await onJoin(rideId);

            alert('Left ride');
            setShowModal(false);
        } catch (err) {
            setJoinError(err.message || 'Error leaving ride');
        } finally {
            setJoining(false);
        }
    };

    // Calculate available seats
    const totalSeats = maxRiders || rideDetails?.seats || 3;
    const takenSeats = rideDetails?.current_members || 0;
    const availableSeats = totalSeats - takenSeats;

    // Parse departureDatetime (ISO format: "2025-11-29T10:30:00")
    const departureObj = departureDatetime ? new Date(departureDatetime) : null;
    const formattedDatetime = departureObj ? departureObj.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).replace(/\//g, '/') : 'Not specified';
    const departureDate = departureObj ? departureObj.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    }).replace(/\//g, '/') : 'Not specified';
    const departureTime = departureObj ? departureObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Not specified';

    const handleJoinClick = async () => {
        setShowModal(true);

        fetchRiders(); // gets riders who have joined

        // If server didn't include isMember, try to fetch membership for this user
        if (rideDetails?.isMember === undefined && rideId) {
            try {
                const token = localStorage.getItem('token');
                if (!token) return; // can't check membership without token

                const res = await fetch(`/api/rides/${rideId}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!res.ok) return;
                const data = await res.json().catch(() => ({}));
                const members = data?.ride?.members || [];
                const user = JSON.parse(localStorage.getItem('user') || 'null');
                const isMem = !!(user && members.some(m => m.user_id === user.id));
                setIsMember(isMem);
            } catch (err) {
                // ignore membership fetch errors — leave isMember as false
                console.debug('Could not fetch membership status', err);
            }
        } else {
            setIsMember(!!rideDetails?.isMember);
        }
    };

    // Use origin/destination for title, fallback to title prop
    const displayTitle = origin && destination ? `${origin} to ${destination}` : title;

    return (
        <>
            <div className="card-container">
                <img  src={image || DEFAULT_RIDE_IMAGE}  alt={displayTitle} className="card-image" />
                <h2 className="card-title">{displayTitle}</h2>
                <p className="card-datetime">Departing at: {formattedDatetime}</p>
                <p className="card-seats">
                    <span className="seats-badge">{availableSeats} of {totalSeats} seats available</span>
                </p>
                <p className="card-content">{content}</p>
                <button 
                    className="card-button" 
                    onClick={handleJoinClick}
                    type="button">
                    {isMember ? 'Joined' : 'Join Ride'}
                </button>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className="modal-close" 
                            onClick={() => setShowModal(false)}
                            aria-label="Close modal"
                        >
                            ×
                        </button>
                        
                        <h2 className="modal-title">{displayTitle}</h2>
                        
                        {/* Tab Navigation */}
                        <div className="modal-tabs">
                            <button 
                                className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
                                onClick={() => setActiveTab('details')}
                                type="button"
                            >
                                Ride Details
                            </button>
                            <button 
                                className={`tab-button ${activeTab === 'riders' ? 'active' : ''}`}
                                onClick={() => setActiveTab('riders')}
                                type="button"
                            >
                                Current Riders ({riders.length})
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'details' ? (
                            <div className="ride-details">
                                <div className="detail-row">
                                    <span className="detail-label">Created by:</span>
                                    <span className="detail-value">{rideDetails?.driver || 'John Doe'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Departure Date:</span>
                                    <span className="detail-value">{departureDate}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Departure Time:</span>
                                    <span className="detail-value">{departureTime}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">From:</span>
                                    <span className="detail-value">{origin || rideDetails?.from || 'Westwood'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">To:</span>
                                    <span className="detail-value">{destination || rideDetails?.to || 'Downtown LA'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Platform:</span>
                                    <span className="detail-value">{platform || 'Not specified'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Max Riders:</span>
                                    <span className="detail-value">{maxRiders || rideDetails?.seats || '3'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Price:</span>
                                    <span className="detail-value">{rideDetails?.price || '$10'}</span>
                                </div>
                                {notes && (
                                    <div className="detail-row">
                                        <span className="detail-label">Notes:</span>
                                        <span className="detail-value">{notes}</span>
                                    </div>
                                )}
                                {createdAt && (
                                    <div className="detail-row">
                                        <span className="detail-label">Posted:</span>
                                        <span className="detail-value">{new Date(createdAt).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="riders-list">
                                {loadingRiders ? (
                                    <div className="riders-loading">Loading riders...</div>
                                ) : ridersError ? (
                                    <div className="riders-error">{ridersError}</div>
                                ) : riders.length === 0 ? (
                                    <div className="riders-empty">No confirmed riders yet</div>
                                ) : (
                                    riders.map((rider) => {
                                        const profile = rider.profile || {};
                                        const fullName = profile.first_name && profile.last_name 
                                            ? `${profile.first_name} ${profile.last_name}` 
                                            : profile.username || 'Unknown User';
                                        const isOwner = rider.user_id === rideDetails?.owner_id;
                                        const joinedDate = new Date(rider.joined_at);
                                        const timeAgo = getTimeAgo(joinedDate);
                                        
                                        return (
                                            <div key={rider.id} className="rider-card">
                                                <div className="rider-avatar">
                                                    {fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="rider-info">
                                                    <div className="rider-name">
                                                        {fullName}
                                                        {isOwner && <span className="owner-badge">Owner</span>}
                                                    </div>
                                                    {profile.username && (
                                                        <div className="rider-username">@{profile.username}</div>
                                                    )}
                                                    <div className="rider-joined">Joined {timeAgo}</div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        <p className="modal-description">{content}</p>

                        {joinError && <p className="error">{joinError}</p>}

                        <div className="modal-actions">
                            <button 
                                className="btn-secondary" 
                                onClick={handleCancel}
                                type="button"
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-primary" 
                                onClick={isMember ? handleConfirmLeave : handleConfirmJoin} 
                                disabled={joining}
                                type="button"
                            >
                                {joining ? (isMember ? 'Leaving…' : 'Joining…') : (isMember ? 'Confirm Leave' : 'Confirm Join')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// Helper function to calculate time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }
    
    return 'just now';
}