import React, { useState, useEffect } from 'react';
import './pages.css';
import { getMyRides, deleteRide, leaveRide, getMyPendingRides } from './api/rides.js';

export default function MyRides() {
  
    const [ownedRides, setOwnedRides] = useState([]);
    const [joinedRides, setJoinedRides] = useState([]);
    const [pendingRides, setPendingRides] = useState([]);  // NEW
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadMyRides();
    }, []);

    async function loadMyRides() {
        setLoading(true);
        setError(null);

        try {
            // Fetch owned/joined rides
            const response = await getMyRides();
            const allRides = response.rides || [];

            const owned = allRides.filter(ride =>
                ride.user_role === 'owner' || ride.user_role === 'owner_and_member'
            );

            const joined = allRides.filter(ride =>
                ride.user_role === 'member'
            );

            setOwnedRides(owned);
            setJoinedRides(joined);

            // fetch pending requests
            const pendingResponse = await getMyPendingRides();
            setPendingRides(pendingResponse.rides || []);

        } catch (err) {
            console.error('Error loading rides:', err);
            setError(err.response?.data?.error || err.message || 'Failed to load rides');
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteRide(rideId) {
        if (!window.confirm('Are you sure you want to delete this ride?')) {
            return;
        }

        try {
            await deleteRide(rideId);
            setOwnedRides(prev => prev.filter(ride => ride.id !== rideId));
            setJoinedRides(prev => prev.filter(ride => ride.id !== rideId));
        } catch (err) {
            console.error('Error deleting ride:', err);
            alert(err.response?.data?.error || 'Failed to delete ride');
        }
    }


    async function handleLeaveRide(rideId) {
        if (!window.confirm('Are you sure you want to leave this ride?')) {
            return;
        }

        try {
            await leaveRide(rideId);
            setJoinedRides(prev => prev.filter(ride => ride.id !== rideId));
        } catch (err) {
            console.error('Error leaving ride:', err);
            alert(err.response?.data?.error || 'Failed to leave ride');
        }
    }

    async function handleCancelPending(rideId) {
        if (!window.confirm('Are you sure you want to cancel this request?')) {
            return;
        }

        try {
            // Use leaveRide to cancel pending request
            await leaveRide(rideId);
            setPendingRides(prev => prev.filter(ride => ride.id !== rideId));
        } catch (err) {
            console.error('Error canceling request:', err);
            alert(err.response?.data?.error || 'Failed to cancel request');
        }
    }


    if (loading) {
        return (
            <div className="page-container">
                <h1>My Rides</h1>
                <p>Loading your rides...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <h1>My Rides</h1>
                <p className="error">{error}</p>
                <button onClick={loadMyRides}>Try Again</button>
            </div>
        );
    }


    return (
        <div className="page-container">
            <h1>My Rides</h1>

            {/* PENDING REQUESTS SECTION */}
            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '600', 
                    marginBottom: '1rem',
                    color: '#1f2937'
                }}>
                    Pending Requests
                </h2>
                
                {pendingRides.length === 0 ? (
                    <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                        No pending ride requests
                    </p>
                ) : (
                    <div className="card-grid">
                        {pendingRides.map(ride => (
                            <PendingRideCard
                                key={ride.id}
                                ride={ride}
                                onCancel={handleCancelPending}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* OWNED RIDES SECTION */}
            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '600', 
                    marginBottom: '1rem',
                    color: '#1f2937'
                }}>
                    Owned Rides
                </h2>
                
                {ownedRides.length === 0 ? (
                    <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                        No rides currently owned
                    </p>
                ) : (
                    <div className="card-grid">
                        {ownedRides.map(ride => (
                            <RideCard
                                key={ride.id}
                                ride={ride}
                                isOwner={true}
                                onDelete={handleDeleteRide}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* JOINED RIDES SECTION */}
            <section>
                <h2 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '600', 
                    marginBottom: '1rem',
                    color: '#1f2937'
                }}>
                    Joined Rides
                </h2>
                
                {joinedRides.length === 0 ? (
                    <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                        No rides currently joined
                    </p>
                ) : (
                    <div className="card-grid">
                        {joinedRides.map(ride => (
                            <RideCard
                                key={ride.id}
                                ride={ride}
                                isOwner={false}
                                onLeave={handleLeaveRide}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}


function PendingRideCard({ ride, onCancel }) {
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
        <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '2px solid #fbbf24', // Yellow border for pending
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            position: 'relative'
        }}>
            {/* Pending Badge */}
            <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#fbbf24',
                color: '#78350f',
                padding: '0.25rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '600'
            }}>
                PENDING
            </div>

            {/* Route */}
            <div>
                <h3 style={{ 
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1f2937'
                }}>
                    {ride.origin_text} → {ride.destination_text}
                </h3>
                {ride.description && (
                    <p style={{ 
                        color: '#6b7280', 
                        margin: 0,
                        fontSize: '0.9rem'
                    }}>
                        {ride.description}
                    </p>
                )}
            </div>

            {/* Details Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                fontSize: '0.9rem'
            }}>
                <div>
                    <strong style={{ color: '#4b5563' }}>Departure:</strong>
                    <div style={{ color: '#6b7280' }}>
                        {formatDate(ride.departure_time)}
                    </div>
                </div>
                <div>
                    <strong style={{ color: '#4b5563' }}>Seats:</strong>
                    <div style={{ color: '#6b7280' }}>
                        {ride.available_seats} available
                    </div>
                </div>
                {ride.price_per_seat && (
                    <div>
                        <strong style={{ color: '#4b5563' }}>Price:</strong>
                        <div style={{ color: '#6b7280' }}>
                            ${ride.price_per_seat} per seat
                        </div>
                    </div>
                )}
                {ride.owner && (
                    <div>
                        <strong style={{ color: '#4b5563' }}>Owner:</strong>
                        <div style={{ color: '#6b7280' }}>
                            {ride.owner.username || ride.owner.first_name}
                        </div>
                    </div>
                )}
            </div>

            {/* Status Message */}
            <div style={{
                background: '#fef3c7',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#78350f',
                textAlign: 'center'
            }}>
                Waiting for owner approval
            </div>

            {/* Cancel Button */}
            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                <button
                    onClick={() => onCancel(ride.id)}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
                >
                    Cancel Request
                </button>
            </div>
        </div>
    );
}


function RideCard({ ride, isOwner, onDelete, onLeave }) {
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
        <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            {/* Route */}
            <div>
                <h3 style={{ 
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1f2937'
                }}>
                    {ride.origin_text} → {ride.destination_text}
                </h3>
                {ride.description && (
                    <p style={{ 
                        color: '#6b7280', 
                        margin: 0,
                        fontSize: '0.9rem'
                    }}>
                        {ride.description}
                    </p>
                )}
            </div>

            {/* Details Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                fontSize: '0.9rem'
            }}>
                <div>
                    <strong style={{ color: '#4b5563' }}>Departure:</strong>
                    <div style={{ color: '#6b7280' }}>
                        {formatDate(ride.departure_time)}
                    </div>
                </div>
                <div>
                    <strong style={{ color: '#4b5563' }}>Seats:</strong>
                    <div style={{ color: '#6b7280' }}>
                        {ride.available_seats} available
                    </div>
                </div>
                {ride.price_per_seat && (
                    <div>
                        <strong style={{ color: '#4b5563' }}>Price:</strong>
                        <div style={{ color: '#6b7280' }}>
                            ${ride.price_per_seat} per seat
                        </div>
                    </div>
                )}
                {ride.owner && (
                    <div>
                        <strong style={{ color: '#4b5563' }}>Owner:</strong>
                        <div style={{ color: '#6b7280' }}>
                            {ride.owner.username || ride.owner.first_name}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Button */}
            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                {isOwner ? (
                    <button
                        onClick={() => onDelete(ride.id)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
                    >
                        Delete Ride
                    </button>
                ) : (
                    <button
                        onClick={() => onLeave(ride.id)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
                    >
                        Leave Ride
                    </button>
                )}
            </div>
        </div>
    );
}