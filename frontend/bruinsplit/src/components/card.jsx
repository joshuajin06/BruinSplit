import React, { useState, useEffect } from 'react';
import "./card.css"
import { set } from 'zod';

const DEFAULT_RIDE_IMAGE = "https://wp.dailybruin.com/images/2021/11/web.news_.globalranking2021.ND_.jpg";

export default function Card({ title, origin, destination, content, image, rideDetails, departureDatetime, platform, notes, maxRiders, createdAt, rideId, onJoin, ownerId, onDelete }) {
    // Get who is accessing the ride
    const [currentUser, setCurrentUser] = useState(null);
    useEffect(() => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            setCurrentUser(storedUser);
        } catch (e) {
            console.error("Error parsing user", e);
        }
    }, []);
    
    const isOwner = currentUser && ownerId && (currentUser.id === ownerId);
    
    // Initial modal states
    const [showModal, setShowModal] = useState(false);
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState(null);

    // MembershipStatus state: null (not member), 'PENDING' (request pending owner approval), 'CONFIRMED JOINING' (joined)
    // Initialize from parent's rideDetails.membership_status; undefined becomes null
    const [membershipStatus, setMembershipStatus] = useState(
        rideDetails?.membership_status || null
    );

    // Tabs for modal
    const [activeTab, setActiveTab] = useState('details'); 
   
    // Consts for riders tab
    const [allMembers, setAllMembers] = useState([]);
    const [loadingRiders, setLoadingRiders] = useState(false);
    const [ridersError, setRidersError] = useState(null);

    // Fetch riders function
    const fetchRiders = async () => {
        if (!rideId) return;
        setLoadingRiders(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/rides/${rideId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!res.ok) throw new Error('Failed to load riders');
            
            const data = await res.json();
            setAllMembers(data?.ride?.members || []);
        } catch (err) {
            setRidersError(err.message);
        } finally {
            setLoadingRiders(false);
        }
    };



    const handleRequestAction = async (memberId, action) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/rides/${rideId}/${action}/${memberId}`, {
                method: 'POST', 
                headers: {
                    'content-type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }   
            });
        

        if (!res.ok) throw new Error(`Failed to ${action} member`);

        await fetchRiders(); // refresh members list
        }catch (err) {
        console.error(`Error during ${action} member:`, err);
        }
    };

    useEffect(() => {
        // Only update membershipStatus if parent provides a value
        // This prevents overwriting local state changes (join/leave) with stale parent data
        if (rideDetails?.membership_status !== undefined) {
            setMembershipStatus(rideDetails.membership_status);
        }
    }, [rideDetails?.membership_status]);

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

            // update local state to PENDING and notify parent to refresh
            setMembershipStatus('PENDING');
            if (onJoin) await onJoin(rideId);

            alert(`Request sent to join: ${displayTitle}`);
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

            // update local state to not a member and notify parent to refresh
            setMembershipStatus(null);
            if (onJoin) await onJoin(rideId);

            alert('Left ride');
            setShowModal(false);
        } catch (err) {
            setJoinError(err.message || 'Error leaving ride');
        } finally {
            setJoining(false);
        }
    };



    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const handleDeleteConfirm = (e) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
    }

    const executeDelete = async () => {

        setDeleteLoading(true);
        setDeleteError(null);

        try{
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/rides/${rideId}`, {
                method: 'DELETE',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete ride');
            }

            if (onDelete) onDelete(rideId);
        } catch (err){
            console.error("Delete error:", err);
            setDeleteError(err.message || 'Error deleting ride');
        } finally {
            setDeleteLoading(false);
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

        await fetchRiders(); // gets riders who have joined

        // If server didn't include membership_status, try to fetch it for this user
        if (rideDetails?.membership_status === undefined && rideId) {
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
                const userMember = user && members.find(m => m.user_id === user.id);
                setMembershipStatus(userMember?.status || null);
            } catch (err) {
                // ignore membership fetch errors — leave membershipStatus as null
                console.debug('Could not fetch membership status', err);
            }
        } else if (rideDetails?.membership_status !== undefined) {
            setMembershipStatus(rideDetails.membership_status);
        }
    };

    const handleKickMember = async (memberId) => {
        try{
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/rides/${rideId}/kick/${memberId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                    }
                });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || 'Failed to kick member');
                }

                await fetchRiders(); // refresh members list after kick
            } catch (err){
                console.error("Kick error:", err);
                alert(err.message);
        }
    };
    

    // Use origin/destination for title, fallback to title prop
    const displayTitle = origin && destination ? `${origin} to ${destination}` : title;

    //filter members into confirmed riders and pending requests
    const confirmedRiders = allMembers.filter(m => m.status === 'CONFIRMED JOINING' || m.status === 'JOINED');
    const pendingRequests = allMembers.filter(m => m.status === 'PENDING');
   
   
   
    return (
        <>
            <div className="card-container">
                {isOwner && (
                    <button 
                        className='deleteButton' 
                        onClick={handleDeleteConfirm} // Calls the function that opens the modal
                        type="button"
                        title="Delete Ride"
                    >
                        {deleteLoading ? '...' : 'x'}
                    </button>
                )}
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
                    {membershipStatus === 'CONFIRMED JOINING' ? 'Joined' : membershipStatus === 'PENDING' ? 'Pending' : 'Join Ride'}
                </button>
            </div>

            {/* DELETE CONFIRMATION MODAL */}
                {showDeleteConfirm && (
                    <div className="modal-overlay delete-modal-overlay">
                        <div 
                            className="delete-modal-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="delete-modal-title">Delete Ride?</h3>

                            <p className="delete-modal-text">
                                Are you sure you want to permanently delete this ride group?
                                This action cannot be undone.
                            </p>

                            {deleteError && <p className="error delete-modal-error">{deleteError}</p>}

                            <div className="delete-modal-actions">
                                <button 
                                    className="btn-secondary"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleteLoading}
                                    type="button"
                                >
                                    Cancel
                                </button>

                                <button
                                    className="btn-primary delete-btn-danger"
                                    onClick={executeDelete}
                                    disabled={deleteLoading}
                                    type="button"
                                >
                                    {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {/* Ride Details */}
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
                                Current Riders ({confirmedRiders.length})
                            </button>
                            {isOwner && (
                                <button 
                                className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
                                onClick={() => setActiveTab('requests')}
                                type="button"
                            >
                                Requests ({pendingRequests.length})
                                {pendingRequests.length > 0 && <span className="notification-dot"></span>}
                            </button>)}
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'details' && (
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
                        )}       

                        {activeTab === 'riders' && (
                            <div className="riders-list">
                                {loadingRiders ? (
                                    <div className="riders-loading">Loading riders...</div>
                                ) : ridersError ? (
                                    <div className="riders-error">{ridersError}</div>
                                ) : confirmedRiders.length === 0 ? (
                                    <div className="riders-empty">No confirmed riders yet</div>
                                ) : (
                                    confirmedRiders.map((rider) => {
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

                                                {!isOwner   && (<button className='kickButton' onClick={() => handleKickMember(rider.user_id)}>Kick</button>)}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {activeTab === 'requests' && isOwner && (
                            <div className="requests-list">
                                {pendingRequests.length === 0 ? (
                                    <div className="riders-empty">No pending requests</div>
                                ) : (
                                    pendingRequests.map((request) => (
                                        <div key={request.user_id} className="request-card">
                                            <div className="rider-info">
                                                <strong>{request.profile?.first_name} {request.profile?.last_name}</strong>
                                                <div className="rider-username">@{request.profile?.username}</div>
                                            </div>
                                            <div className="request-actions">
                                                <button 
                                                    className="btn-approve" 
                                                    onClick={() => handleRequestAction(request.user_id, 'approve')}
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                    className="btn-reject" 
                                                    onClick={() => handleRequestAction(request.user_id, 'reject')}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))
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
                                onClick={membershipStatus ? handleConfirmLeave : handleConfirmJoin} 
                                disabled={joining}
                                type="button"
                            >
                                {joining ? (membershipStatus ? 'Canceling…' : 'Joining…') : (membershipStatus ? 'Cancel Request' : 'Confirm Join')}
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