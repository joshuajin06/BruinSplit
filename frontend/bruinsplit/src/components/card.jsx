import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./card.css";
import { joinRide, getRideById } from '../pages/api/rides.js';

const DEFAULT_RIDE_IMAGE = "https://cdn.i-scmp.com/sites/default/files/styles/1200x800/public/images/methode/2017/05/19/2b2d8790-3c6a-11e7-8ee3-761f02c18070_1280x720_204107.jpg?itok=oBUq3Omm";

export default function Card({ title, content, image, rideDetails, ride }) {
    const navigate = useNavigate();
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState(null);
    const [rideDetailsFull, setRideDetailsFull] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState(null);

    const handleJoinClick = () => {
        setShowJoinModal(true);
        setJoinError(null);
    };

    const handleDetailsClick = async () => {
        if (!ride || !ride.id) {
            alert('Error: Ride information is missing');
            return;
        }

        setShowDetailsModal(true);
        setDetailsError(null);
        setLoadingDetails(true);

        try {
            // Fetch full ride details including members
            const response = await getRideById(ride.id);
            setRideDetailsFull(response.ride);
        } catch (err) {
            console.error('Error loading ride details:', err);
            setDetailsError(err.response?.data?.error || err.message || 'Failed to load ride details');
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleConfirmJoin = async () => {
        if (!ride || !ride.id) {
            alert('Error: Ride information is missing');
            return;
        }

        setJoining(true);
        setJoinError(null);

        try {
            await joinRide(ride.id);
            alert(`Successfully requested to join: ${title}\n\nNote: Your request is pending approval from the ride owner.`);
            setShowJoinModal(false);
        } catch (err) {
            console.error('Join ride error:', err);
            const errorMsg = err.response?.data?.error || err.message || 'Failed to join ride';
            setJoinError(errorMsg);
        } finally {
            setJoining(false);
        }
    };

    const handleViewProfile = (userId) => {
        navigate(`/profile/${userId}`);
    };

    const displayTitle = title || (ride ? `${ride.origin_text} → ${ride.destination_text}` : 'Ride');
    const displayContent = content || ride?.description || ride?.notes || 'No description';
    
    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <div className="card-container">
                <img src={image || DEFAULT_RIDE_IMAGE} alt={displayTitle} className="card-image" />
                <h2 className="card-title">{displayTitle}</h2>
                <p className="card-content">{displayContent}</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                        className="card-button" 
                        onClick={handleDetailsClick}
                        type="button"
                        disabled={!ride}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}
                    >
                        Details
                    </button>
                    <button 
                        className="card-button" 
                        onClick={handleJoinClick}
                        type="button"
                        disabled={!ride}
                        style={{ flex: 1 }}
                    >
                        Join Ride
                    </button>
                </div>
            </div>

            {showJoinModal && (
                <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className="modal-close" 
                            onClick={() => setShowJoinModal(false)}
                            aria-label="Close modal"
                        >
                            ×
                        </button>
                        
                        <h2 className="modal-title">{displayTitle}</h2>
                        
                        {joinError && (
                            <div className="error" style={{ 
                                marginBottom: '1rem',
                                padding: '0.75rem',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                borderRadius: '0.5rem',
                                fontSize: '0.9rem'
                            }}>
                                {joinError}
                            </div>
                        )}
                        
                        <div className="ride-details">
                            {ride ? (
                                <>
                                    <div className="detail-row">
                                        <span className="detail-label">Owner:</span>
                                        <span className="detail-value">
                                            {ride.owner?.username || ride.owner?.first_name || 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Departure:</span>
                                        <span className="detail-value">
                                            {formatDate(ride.departure_time)}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">From:</span>
                                        <span className="detail-value">{ride.origin_text}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">To:</span>
                                        <span className="detail-value">{ride.destination_text}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Seats Available:</span>
                                        <span className="detail-value">
                                            {ride.available_seats !== undefined 
                                                ? ride.available_seats 
                                                : ride.max_seats || 'N/A'}
                                        </span>
                                    </div>
                                    {ride.price_per_seat && (
                                        <div className="detail-row">
                                            <span className="detail-label">Price:</span>
                                            <span className="detail-value">${ride.price_per_seat} per seat</span>
                                        </div>
                                    )}
                                    <div className="detail-row">
                                        <span className="detail-label">Platform:</span>
                                        <span className="detail-value">{ride.platform || 'N/A'}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="detail-row">
                                        <span className="detail-label">Driver:</span>
                                        <span className="detail-value">{rideDetails?.driver || 'John Doe'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Departure:</span>
                                        <span className="detail-value">{rideDetails?.departure || '8:00 AM'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">From:</span>
                                        <span className="detail-value">{rideDetails?.from || 'Westwood'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">To:</span>
                                        <span className="detail-value">{rideDetails?.to || 'Downtown LA'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Seats Available:</span>
                                        <span className="detail-value">{rideDetails?.seats || '3'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Price:</span>
                                        <span className="detail-value">{rideDetails?.price || '$10'}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <p className="modal-description">{displayContent}</p>

                        <div className="modal-actions">
                            <button 
                                className="btn-secondary" 
                                onClick={() => setShowJoinModal(false)}
                                disabled={joining}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-primary" 
                                onClick={handleConfirmJoin}
                                disabled={joining || !ride}
                            >
                                {joining ? 'Joining...' : 'Confirm Join'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
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
                            <div className="error" style={{ 
                                padding: '0.75rem',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                borderRadius: '0.5rem',
                                fontSize: '0.9rem'
                            }}>
                                {detailsError}
                            </div>
                        ) : rideDetailsFull ? (
                            <>
                                {/* Ride Logistics */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1f2937' }}>Ride Logistics</h3>
                                    <div className="ride-details">
                                        <div className="detail-row">
                                            <span className="detail-label">Departure:</span>
                                            <span className="detail-value">
                                                {formatDate(rideDetailsFull.departure_time)}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">From:</span>
                                            <span className="detail-value">{rideDetailsFull.origin_text}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">To:</span>
                                            <span className="detail-value">{rideDetailsFull.destination_text}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Seats Available:</span>
                                            <span className="detail-value">
                                                {rideDetailsFull.available_seats} / {rideDetailsFull.max_seats}
                                            </span>
                                        </div>
                                        {rideDetailsFull.price_per_seat && (
                                            <div className="detail-row">
                                                <span className="detail-label">Price:</span>
                                                <span className="detail-value">${rideDetailsFull.price_per_seat} per seat</span>
                                            </div>
                                        )}
                                        <div className="detail-row">
                                            <span className="detail-label">Platform:</span>
                                            <span className="detail-value">{rideDetailsFull.platform || 'N/A'}</span>
                                        </div>
                                        {rideDetailsFull.notes && (
                                            <div className="detail-row">
                                                <span className="detail-label">Notes:</span>
                                                <span className="detail-value">{rideDetailsFull.notes}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Ride Owner */}
                                {rideDetailsFull.owner && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1f2937' }}>Ride Owner</h3>
                                        <div style={{
                                            padding: '1rem',
                                            background: '#f9fafb',
                                            borderRadius: '0.5rem',
                                            border: '1px solid #e5e7eb'
                                        }}>
                                            <div style={{ marginBottom: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleViewProfile(rideDetailsFull.owner.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#6366f1',
                                                        cursor: 'pointer',
                                                        fontSize: '1rem',
                                                        fontWeight: '600',
                                                        textDecoration: 'underline',
                                                        padding: 0
                                                    }}
                                                >
                                                    {rideDetailsFull.owner.username || 
                                                     `${rideDetailsFull.owner.first_name || ''} ${rideDetailsFull.owner.last_name || ''}`.trim() || 
                                                     'Unknown User'}
                                                </button>
                                            </div>
                                            {rideDetailsFull.owner.email && (
                                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                                    📧 {rideDetailsFull.owner.email}
                                                </div>
                                            )}
                                            {rideDetailsFull.owner.phone_number && (
                                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                    📱 {rideDetailsFull.owner.phone_number}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Current Members */}
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1f2937' }}>
                                        Current Members ({rideDetailsFull.members?.length || 0})
                                    </h3>
                                    {rideDetailsFull.members && rideDetailsFull.members.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {rideDetailsFull.members.map((member) => (
                                                <div
                                                    key={member.user_id}
                                                    style={{
                                                        padding: '1rem',
                                                        background: '#f9fafb',
                                                        borderRadius: '0.5rem',
                                                        border: '1px solid #e5e7eb'
                                                    }}
                                                >
                                                    <div style={{ marginBottom: '0.5rem' }}>
                                                        <button
                                                            onClick={() => handleViewProfile(member.user_id)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#6366f1',
                                                                cursor: 'pointer',
                                                                fontSize: '1rem',
                                                                fontWeight: '600',
                                                                textDecoration: 'underline',
                                                                padding: 0
                                                            }}
                                                        >
                                                            {member.profile?.username || 
                                                             `${member.profile?.first_name || ''} ${member.profile?.last_name || ''}`.trim() || 
                                                             'Unknown User'}
                                                        </button>
                                                    </div>
                                                    {member.profile?.email && (
                                                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                                            📧 {member.profile.email}
                                                        </div>
                                                    )}
                                                    {member.profile?.phone_number && (
                                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                            📱 {member.profile.phone_number}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No members yet</p>
                                    )}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </>
    );
}