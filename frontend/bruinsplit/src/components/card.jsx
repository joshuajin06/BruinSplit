import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "./card.css"
import { useAuth } from '../context/AuthContext'
import { getTimeAgo, formatDatetimeLocal, hashString } from './utils/cardUtils';
import { 
    getRideById, 
    joinRide, 
    leaveRide, 
    deleteRide, 
    updateRide,
    manageRequest,     
    kickMember,        
    transferOwnership,
    getPendingRequests
} from '../pages/api/rides';
import { sendFriendRequest, getFriends } from '../pages/api/friends';

const gradients = [
  "gradient-blue",
  "gradient-purple",
  "gradient-green",
  "gradient-orange",
  "gradient-pink",
  "gradient-red",
];

export default function Card({ title, origin, destination, content, image, rideDetails, departureDatetime, platform, notes, maxRiders, createdAt, rideId, onJoin, ownerId, onDelete, onTransferOwnership, onEdit, onLeave }) {
    const navigate = useNavigate();

    // Random gradient for title
    const gradientClass = gradients[hashString(rideId || title) % gradients.length];
    
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

    // MembershipStatus state
    const [membershipStatus, setMembershipStatus] = useState(
        rideDetails?.membership_status || null
    );

    // Tabs for modal
    const [activeTab, setActiveTab] = useState('details'); 
   
    // Consts for riders tab
    const [allMembers, setAllMembers] = useState([]);
    const [loadingRiders, setLoadingRiders] = useState(false);
    const [ridersError, setRidersError] = useState(null);

    // State for pending requests tab
    const [pendingRequestsList, setPendingRequestsList] = useState([]);
    const [loadingPendingRequests, setLoadingPendingRequests] = useState(false);
    const [pendingRequestsError, setPendingRequestsError] = useState(null);

    // State for details modal
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [rideDetailsFull, setRideDetailsFull] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState(null);

    // Friends state
    const [friendsList, setFriendsList] = useState([]);
    const [sendingRequest, setSendingRequest] = useState({});
    const [sentRequests, setSentRequests] = useState([]);

    // Fetch friends list and pending requests
    useEffect(() => {
        const fetchFriendsData = async () => {
            try {
                const friendsData = await getFriends();
                setFriendsList(friendsData.friends || []);
                
                // Also fetch pending requests to know who we've sent requests to
                const { getPendingRequests } = await import('../pages/api/friends');
                const requestsData = await getPendingRequests();
                setSentRequests(requestsData.sent || []);
            } catch (error) {
                console.error('Failed to fetch friends data:', error);
            }
        };
        if (currentUser) {
            fetchFriendsData();
        }
    }, [currentUser]);

    // Check if user is a friend
    const isFriend = (userId) => {
        return friendsList.some(friend => friend.id === userId);
    };

    // Check if friend request was sent
    const hasRequestSent = (userId) => {
        return sentRequests.some(request => request.id === userId);
    };

    // Handle add friend
    const handleAddFriend = async (userId) => {
        if (sendingRequest[userId]) return;
        
        setSendingRequest(prev => ({ ...prev, [userId]: true }));
        try {
            await sendFriendRequest(userId);
            // Refresh friends list and pending requests
            const friendsData = await getFriends();
            setFriendsList(friendsData.friends || []);
            
            const { getPendingRequests } = await import('../pages/api/friends');
            const requestsData = await getPendingRequests();
            setSentRequests(requestsData.sent || []);
        } catch (error) {
            console.error('Failed to send friend request:', error);
            alert('Failed to send friend request');
        } finally {
            setSendingRequest(prev => ({ ...prev, [userId]: false }));
        }
    };

    // Fetch riders function
    const fetchRiders = async () => {
        if (!rideId) return;
        setLoadingRiders(true);
        try {
            const data = await getRideById(rideId);
            setAllMembers(data?.ride?.members || []);
        } catch (err) {
            setRidersError(err.response?.data?.message || err.message);
        } finally {
            setLoadingRiders(false);
        }
    };

    // Fetch pending requests function
    const fetchPendingRequests = async () => {
        if (!rideId) return;
        setLoadingPendingRequests(true);
        try {
            const data = await getPendingRequests(rideId);
            setPendingRequestsList(data?.pending_requests || []);
        } catch (err) {
            setPendingRequestsError(err.response?.data?.message || err.message);
        } finally {
            setLoadingPendingRequests(false);
        }
    };

    // Fetch full ride details
    const fetchRideDetails = async () => {
        if (!rideId) return;
        setLoadingDetails(true);
        setDetailsError(null);
        try {
            const data = await getRideById(rideId);
            setRideDetailsFull(data.ride);
        } catch (err) {
            setDetailsError(err.response?.data?.message || err.message);
        } finally {
            setLoadingDetails(false);
        }
    };

    // Handle details button click
    const handleDetailsClick = async () => {
        setShowDetailsModal(true);
        if (!rideDetailsFull) {
            await fetchRideDetails();
        }
    };

    // Handle viewing profile
    const handleViewProfile = (userId) => {
        navigate(`/profile/${userId}`);
    };

    // Handle Approve/Reject 
    const handleRequestAction = async (memberId, action) => {
        try {
            await manageRequest(rideId, memberId, action);
            await fetchRiders(); // refresh members list
            await fetchPendingRequests(); // refresh pending requests list
        } catch (err) {
            console.error(`Error during ${action} member:`, err);
            alert(`Failed to ${action} member`);
        }
    };

    useEffect(() => {
        if (rideDetails?.membership_status !== undefined) {
            setMembershipStatus(rideDetails.membership_status);
        }
    }, [rideDetails?.membership_status]);

    const handleCancel = () => {
        setShowModal(false);
        setJoinError(null);
        setActiveTab('details');
    }

    const handleConfirmJoin = async () => {
        const displayTitle = origin && destination ? `${origin} to ${destination}` : title;
        setJoining(true);
        setJoinError(null);

        try {
            if (!rideId) throw new Error('Ride id is missing');

            await joinRide(rideId);

            setMembershipStatus('PENDING');
            if (onJoin) await onJoin(rideId);

            alert(`Request sent to join: ${displayTitle}`);
            setShowModal(false);
        } catch (err) {
            setJoinError(err.response?.data?.error || err.message || 'Error joining ride');
        } finally {
            setJoining(false);
        }
    };

    const handleConfirmLeave = async () => {
        setJoining(true);
        setJoinError(null);

        if (isOwner) {
            setJoining(false);
            return;
        }

        try {
            if (!rideId) throw new Error('Ride id is missing');

            await leaveRide(rideId);

            setMembershipStatus(null);
            if (onLeave) {
                await onLeave(rideId);
            } else if (onJoin) {
                await onJoin(rideId);
            }

            alert('Left ride');
            setShowModal(false);
        } catch (err) {
            setJoinError(err.response?.data?.error || err.message || 'Error leaving ride');
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

        try {
            await deleteRide(rideId);
            if (onDelete) onDelete(rideId);
        } catch (err){
            console.error("Delete error:", err);
            setDeleteError(err.response?.data?.error || err.message || 'Error deleting ride');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Calculate available seats
    const totalSeats = maxRiders || rideDetails?.seats || 3;
    const takenSeats = rideDetails?.current_members || 0;
    const availableSeats = totalSeats - takenSeats;

    // Parse departureDatetime
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
        if (isOwner) {
            await fetchPendingRequests(); // fetch pending requests if user is owner
        }

        // Check membership status if undefined
        if (rideDetails?.membership_status === undefined && rideId) {
            try {
                const data = await getRideById(rideId);
                const members = data?.ride?.members || [];
                const user = JSON.parse(localStorage.getItem('user') || 'null');
                const userMember = user && members.find(m => m.user_id === user.id);
                setMembershipStatus(userMember?.status || null);
            } catch (err) {
                console.debug('Could not fetch membership status', err);
            }
        } else if (rideDetails?.membership_status !== undefined) {
            setMembershipStatus(rideDetails.membership_status);
        }
    };

    // Implemented via api call - UPDATED
    const handleKickMember = async (memberId) => {
        try {
            await kickMember(rideId, memberId);
            await fetchRiders(); // refresh members list after kick
        } catch (err){
            console.error("Kick error:", err);
        }
    };

    // Implemented via api call - UPDATED
    const handleTransferOnwership = async (newOwnerId) => {
        if (!isOwner) return;

        try {
            await transferOwnership(rideId, newOwnerId);
            if (onTransferOwnership) onTransferOwnership(rideId, newOwnerId);
            await fetchRiders(); //refresh members list

        } catch (err) {
            console.error("Transfer ownership error:", err);
        }
    }

    // Default form state for editing ride
    const [form, setForm] = useState({
            origin_text: origin || '',
            destination_text: destination || '',
            depart_at: formatDatetimeLocal(departureDatetime) || '',
            platform: platform ,
            max_seats: maxRiders || 2,
            notes: notes || ''
        });

    function handleEditChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }
    
    const handleEdit = async(e) => {
        e.preventDefault();

        if (!isOwner) return;

        try {
            await updateRide(rideId, form);
            if (onEdit) onEdit(rideId);
            setEditModalOpen(false);
        } catch (err) {
            console.error("Edit ride error:", err);
        }
    }

    // Use origin/destination for title, fallback to title prop
    const displayTitle = origin && destination ? `${origin} ➡ ${destination}` : title;

    // Filter members
    const confirmedRiders = allMembers.filter(m => m.status === 'CONFIRMED JOINING' || m.status === 'JOINED');
   
    const [editModalOpen, setEditModalOpen] = useState(false);

    // Memoize confirmed members for card display to prevent re-renders
    const [cardMembers, setCardMembers] = useState([]);

    // Fetch members on mount for the card face
    useEffect(() => {
    const fetchCardMembers = async () => {
        if (!rideId) return;
        try {
            const data = await getRideById(rideId);
            const members = data?.ride?.members || [];
            // Only show confirmed members
            const confirmed = members.filter(m => m.status === 'CONFIRMED JOINING' || m.status === 'JOINED');
            setCardMembers(confirmed);
        } catch (err) {
            console.debug('Could not fetch members for card', err);
        }
    };
    
    fetchCardMembers();
    }, [rideId]);
   

    // Rendering 
    return (
        <>
{/*Main Card*/}
            <div className="card-container">
                {isOwner && (
                    <div className='owner-utilities'>
                        <button 
                            className='deleteButton' 
                            onClick={handleDeleteConfirm} // Calls the function that opens the modal
                            type="button"
                            title="Delete Ride"
                        >
                            {deleteLoading ? '...' : 'x'}
                        </button>

                        <button className='editButton' type='button' onClick={() => setEditModalOpen(true)}>edit</button>
                    </div>
                )}
                <h2 className={`card-title ${gradientClass}`}>{displayTitle}</h2>

                {/* Member Avatars Display */}
                {cardMembers.length > 0 && (
                    <div className="card-members">
                        <div className="member-avatars">
                            {cardMembers.slice(0, 4).map((member, index) => {
                                const profile = member.profile || {};
                                const fullName = profile.first_name && profile.last_name 
                                    ? `${profile.first_name} ${profile.last_name}` 
                                    : profile.username || 'Unknown User';
                                
                                return (
                                    <div
                                        key={member.id}
                                        className="member-avatar-small"
                                        title={fullName}>
                                        {profile?.profile_photo_url ? (
                                            <img src={profile.profile_photo_url} alt="Profile" className="navbar-profile-pic" />
                                        ) : 
                                        (
                                            <div className="navbar-profile-placeholder">
                                                {profile?.first_name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {cardMembers.length > 4 && (
                                <div className="member-avatar-small member-avatar-more" title={`+${cardMembers.length - 4} more`}>
                                    +{cardMembers.length - 4}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                <p className="card-datetime">Departing at: {formattedDatetime}</p>
                <p className="card-seats">
                    <span className="seats-badge">{availableSeats} of {totalSeats} seats available</span>
                </p>
                <p className="card-content">{content}</p>


                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                        className="card-button-details" 
                        onClick={handleDetailsClick}
                        type="button"
                        style={{ flex: '1', minWidth: '100px' }}
                    >
                        Details
                        
                    </button>
                    <button 
                        className="card-button-join" 
                        onClick={handleJoinClick}
                        type="button"
                        style={{ flex: '1', minWidth: '100px' }}
                    >
                        {membershipStatus === 'CONFIRMED JOINING' ? 'Joined' : membershipStatus === 'PENDING' ? 'Pending' : 'Join Ride'}
                    </button>
                </div>
            </div>
{/*Main Card*/}


            {/* EDIT RIDE MODAL */} 
            {editModalOpen && isOwner && (
                <section className="ride-form" onClick={() => setEditModalOpen(false)}>
                    <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleEdit}>
                        <button 
                            className="modal-close" 
                            onClick={() => setEditModalOpen(false)}
                            aria-label="Close modal" 
                            type="button">
                        ×
                        </button>
                        <h2>Edit Ride</h2>
                        {/*modalError && <p className="error">{modalError}</p>*/}

                        <label>
                            Origin
                            <input name="origin_text" value={form.origin_text} onChange={handleEditChange} />
                        </label>

                        <label>
                            Destination
                            <input name="destination_text" value={form.destination_text} onChange={handleEditChange}/>
                        </label>

                        <label>
                            Departure
                            <input name="depart_at" type="datetime-local" value={form.depart_at} onChange={handleEditChange} />
                        </label>

                        <label>
                            Platform
                            <select name="platform" value={form.platform} onChange={handleEditChange}>
                                <option>LYFT</option>
                                <option>UBER</option>
                                <option>WAYMO</option>
                                <option>OTHER</option>
                            </select>
                        </label>

                        <label>
                            Max Seats
                            <input name="max_seats" type="number" min="2" max="6" value={form.max_seats} onChange={handleEditChange} />
                        </label>

                        <label>
                            Notes
                            <textarea name="notes" value={form.notes} onChange={handleEditChange} />
                        </label>

                        <div className="form-actions">
                            <button type="submit">Confirm</button>
                            <button type="button" onClick={() => setForm({origin_text: origin || '',
                                destination_text: destination || '',
                                depart_at: formatDatetimeLocal(departureDatetime) || '',
                                platform: platform || 'LYFT',
                                max_seats: maxRiders || 2,
                                notes: notes || ''})}>
                            Reset</button>
                        </div>
                    </form>
                </section>
            )}

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
            {/* Join/Manage Modal */}
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
                                Requests ({pendingRequestsList.length})
                                {pendingRequestsList.length > 0 && <span className="notification-dot"></span>}
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
                                        const isRiderOwner = rider.user_id === rideDetails?.owner_id;
                                        const joinedDate = new Date(rider.joined_at);
                                        const timeAgo = getTimeAgo(joinedDate);
                                        
                                        return (
                                            <div key={rider.id} className="rider-card">
                                                <div className="rider-avatar">
                                                    {profile?.profile_photo_url ? (
                                                        <img src={profile.profile_photo_url} alt="Profile" className="navbar-profile-pic" />
                                                    ) : 
                                                    (
                                                        <div className="navbar-profile-placeholder">
                                                            {profile?.first_name?.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="rider-info">
                                                    <div className="rider-name">
                                                        <a 
                                                            href="#" 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleViewProfile(rider.user_id);
                                                            }}
                                                            style={{ cursor: 'pointer', textDecoration: 'underline', color: 'inherit' }}
                                                        >
                                                            {fullName}
                                                        </a>
                                                        {isRiderOwner && <span className="owner-badge">Owner</span>}
                                                    </div>
                                                    {profile.username && (
                                                        <div className="rider-username">@{profile.username}</div>
                                                    )}
                                                    <div className="rider-joined">Joined {timeAgo}</div>
                                                </div>

                                                {isOwner && rider.user_id !== ownerId && (
                                                    <section className='ride-member-options'>
                                                        <button className='kickButton' onClick={() => handleKickMember(rider.user_id)}>Kick</button>

                                                        <button className='makeOwner' onClick={() => handleTransferOnwership(rider.user_id)}>Make Owner</button>
                                                    </section>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {activeTab === 'requests' && isOwner && (
                            <div className="requests-list">
                                {loadingPendingRequests ? (
                                    <div className="riders-loading">Loading requests...</div>
                                ) : pendingRequestsError ? (
                                    <div className="riders-error">{pendingRequestsError}</div>
                                ) : pendingRequestsList.length === 0 ? (
                                    <div className="riders-empty">No pending requests</div>
                                ) : (
                                    pendingRequestsList.map((request) => (
                                        <div key={request.user_id} className="request-card">
                                            <div className="rider-avatar">
                                                {request.profile?.profile_photo_url ? (
                                                    <img src={request.profile.profile_photo_url} alt="Profile" className="navbar-profile-pic" />
                                                ) : 
                                                (
                                                    <div className="navbar-profile-placeholder">
                                                        {request.profile?.first_name?.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
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

            {/* Details Modal */}
            {showDetailsModal && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className="modal-close" 
                            onClick={() => setShowDetailsModal(false)}
                            aria-label="Close modal"
                        >
                            ×
                        </button>
                        
                        <h2 className="modal-title">{displayTitle}</h2>
                        
                        {loadingDetails ? (
                            <p>Loading ride details...</p>
                        ) : detailsError ? (
                            <p className="error">{detailsError}</p>
                        ) : rideDetailsFull ? (
                            <>
                                {/* Ride Logistics */}
                                <div className="ride-details">
                                    <h3>Ride Logistics</h3>
                                    <div className="detail-row">
                                        <span className="detail-label">From:</span>
                                        <span className="detail-value">{rideDetailsFull.origin_text || origin || 'Not specified'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">To:</span>
                                        <span className="detail-value">{rideDetailsFull.destination_text || destination || 'Not specified'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Departure:</span>
                                        <span className="detail-value">{formattedDatetime}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Platform:</span>
                                        <span className="detail-value">{rideDetailsFull.platform || platform || 'Not specified'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Max Seats:</span>
                                        <span className="detail-value">{rideDetailsFull.max_seats || maxRiders || 'Not specified'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Available Seats:</span>
                                        <span className="detail-value">{rideDetailsFull.available_seats || availableSeats}</span>
                                    </div>
                                    {rideDetailsFull.notes && (
                                        <div className="detail-row">
                                            <span className="detail-label">Notes:</span>
                                            <span className="detail-value">{rideDetailsFull.notes}</span>
                                        </div>
                                    )}
                                    {rideDetailsFull.created_at && (
                                        <div className="detail-row">
                                            <span className="detail-label">Posted:</span>
                                            <span className="detail-value">{new Date(rideDetailsFull.created_at).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Owner Info */}
                                {rideDetailsFull.owner && (
                                    <div className="owner-section" style={{ marginTop: '20px', marginBottom: '20px' }}>
                                        <h3>Ride Owner</h3>
                                        <div className="rider-card">
                                            <div className="rider-avatar">
                                                {rideDetailsFull.owner.profile_photo_url ? (
                                                    <img src={rideDetailsFull.owner.profile_photo_url} alt="Profile" className="navbar-profile-pic" />
                                                ) : 
                                                (
                                                    <div className="navbar-profile-placeholder">
                                                        {rideDetailsFull.owner.first_name?.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="rider-info">
                                                <div className="rider-name">
                                                    <a 
                                                        href="#" 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleViewProfile(rideDetailsFull.owner.id);
                                                        }}
                                                        style={{ cursor: 'pointer', textDecoration: 'underline', color: 'inherit' }}
                                                    >
                                                        {rideDetailsFull.owner.first_name} {rideDetailsFull.owner.last_name}
                                                    </a>
                                                    <span className="owner-badge">Owner</span>
                                                </div>
                                                {rideDetailsFull.owner.username && (
                                                    <div className="rider-username">@{rideDetailsFull.owner.username}</div>
                                                )}
                                                {rideDetailsFull.owner.email && (
                                                    <div className="rider-email" style={{ fontSize: '0.9em', color: '#666' }}>{rideDetailsFull.owner.email}</div>
                                                )}
                                                {rideDetailsFull.owner.phone_number && (
                                                    <div className="rider-phone" style={{ fontSize: '0.9em', color: '#666' }}>{rideDetailsFull.owner.phone_number}</div>
                                                )}
                                                {currentUser && currentUser.id !== rideDetailsFull.owner.id && (
                                                    <div style={{ marginTop: '10px' }}>
                                                        {isFriend(rideDetailsFull.owner.id) ? (
                                                            <span className="friend-badge">Friend</span>
                                                        ) : hasRequestSent(rideDetailsFull.owner.id) ? (
                                                            <span className="request-sent-badge">Friend Req. Sent</span>
                                                        ) : (
                                                            <button 
                                                                className="add-friend-btn"
                                                                onClick={() => handleAddFriend(rideDetailsFull.owner.id)}
                                                                disabled={sendingRequest[rideDetailsFull.owner.id]}
                                                            >
                                                                {sendingRequest[rideDetailsFull.owner.id] ? 'Sending...' : 'Add Friend'}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Current Members */}
                                <div className="members-section" style={{ marginTop: '20px' }}>
                                    <h3>Current Members ({rideDetailsFull.members?.filter(m => m.status === 'CONFIRMED JOINING').length || 0})</h3>
                                    {!rideDetailsFull.members || rideDetailsFull.members.length === 0 ? (
                                        <p>No members yet.</p>
                                    ) : (
                                        <div className="riders-list">
                                            {rideDetailsFull.members
                                                .filter(m => m.status === 'CONFIRMED JOINING')
                                                .map((member) => {
                                                    const profile = member.profile || {};
                                                    const fullName = profile.first_name && profile.last_name 
                                                        ? `${profile.first_name} ${profile.last_name}` 
                                                        : profile.username || 'Unknown User';
                                                    
                                                    return (
                                                        <div key={member.id} className="rider-card">
                                                            <div className="rider-avatar">
                                                                {profile?.profile_photo_url ? (
                                                                    <img src={profile.profile_photo_url} alt="Profile" className="navbar-profile-pic" />
                                                                ) : 
                                                                (
                                                                    <div className="navbar-profile-placeholder">
                                                                        {profile?.first_name?.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="rider-info">
                                                                <div className="rider-name">
                                                                    <a 
                                                                        href="#" 
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            handleViewProfile(member.user_id);
                                                                        }}
                                                                        style={{ cursor: 'pointer', textDecoration: 'underline', color: 'inherit' }}
                                                                    >
                                                                        {fullName}
                                                                    </a>
                                                                </div>
                                                                {profile.username && (
                                                                    <div className="rider-username">@{profile.username}</div>
                                                                )}
                                                                {profile.email && (
                                                                    <div className="rider-email" style={{ fontSize: '0.9em', color: '#666' }}>{profile.email}</div>
                                                                )}
                                                                {currentUser && currentUser.id !== member.user_id && (
                                                                    <div style={{ marginTop: '10px' }}>
                                                                        {isFriend(member.user_id) ? (
                                                                            <span className="friend-badge">Friend</span>
                                                                        ) : hasRequestSent(member.user_id) ? (
                                                                            <span className="request-sent-badge">Friend Req. Sent</span>
                                                                        ) : (
                                                                            <button 
                                                                                className="add-friend-btn"
                                                                                onClick={() => handleAddFriend(member.user_id)}
                                                                                disabled={sendingRequest[member.user_id]}
                                                                            >
                                                                                {sendingRequest[member.user_id] ? 'Sending...' : 'Add Friend'}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p>No ride details available.</p>
                        )}
                        
                        <div className="modal-actions" style={{ marginTop: '20px' }}>
                            <button 
                                className="btn-secondary" 
                                onClick={() => setShowDetailsModal(false)}
                                type="button"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}