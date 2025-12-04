import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import './pages.css';
import Card from '../components/card.jsx';
import { getMyRides, getMyPendingRides, deleteRide, leaveRide } from './api/rides.js';

export default function MyRides() {
    const [pendingRides, setPendingRides] = useState([]);
    const [joinedRides, setJoinedRides] = useState([]);
    const [createdRides, setCreatedRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { user } = useAuth();

    useEffect(() => {
        loadMyRides();
    }, []);

    async function loadMyRides() {
        setLoading(true);
        setError(null);
        try {
            // Fetch all my rides (includes owned and joined)
            const myRidesResponse = await getMyRides();
            const allRides = myRidesResponse.rides || [];

            // Fetch pending rides
            const pendingResponse = await getMyPendingRides();
            const pending = pendingResponse.rides || [];

            // Separate rides by role
            const owned = allRides.filter(ride => ride.owner_id === user?.id);
            const joined = allRides.filter(ride => ride.owner_id != user?.id);

            setCreatedRides(owned);
            setJoinedRides(joined);
            setPendingRides(pending);
        } catch (err) {
            console.error('Error loading my rides:', err);
            setError(err.message || 'Failed to load rides');
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteRide(rideId) {
        try {
            // Remove from UI immediately
            setCreatedRides(prev => prev.filter(ride => ride.id !== rideId));
            setJoinedRides(prev => prev.filter(ride => ride.id !== rideId));
            setPendingRides(prev => prev.filter(ride => ride.id !== rideId));
            
            // Then refresh from server to ensure consistency
            await loadMyRides();
        } catch (err) {
            console.error('Error in handleDeleteRide:', err);
            // Refresh anyway to restore accurate state
            await loadMyRides();
        }
    }

    async function handleLeaveRide(rideId) {
        if (!window.confirm('Are you sure you want to leave this ride?')) {
            return;
        }
        try {
            await leaveRide(rideId);
            await loadMyRides(); // Refresh
        } catch (err) {
            alert('Failed to leave ride: ' + (err.message || 'Unknown error'));
        }
    }

    async function handleCancelPending(rideId) {
        if (!window.confirm('Are you sure you want to cancel this request?')) {
            return;
        }
        try {
            await leaveRide(rideId); // Cancel pending uses the same leave endpoint
            await loadMyRides(); // Refresh
        } catch (err) {
            alert('Failed to cancel request: ' + (err.message || 'Unknown error'));
        }
    }

    

    function renderRideCard(ride, showActions = true, section = 'created') {
        let membershipStatus = ride.membership_status;
        
        if (section === 'joined') {
            membershipStatus = 'CONFIRMED JOINING';
        } else if (section === 'pending') {
            membershipStatus = 'PENDING';
        }

        return (
            <Card
                key={ride.id}
                rideId={ride.id}
                ownerId={ride.owner_id}
                origin={ride.origin_text}
                destination={ride.destination_text}
                departureDatetime={ride.depart_at}
                platform={ride.platform}
                maxRiders={ride.max_seats}
                notes={ride.notes}
                createdAt={ride.created_at}
                content={ride.notes || 'Looking for riders'}
                rideDetails={{
                    driver: ride.owner?.first_name ? `${ride.owner.first_name} ${ride.owner.last_name}` : 'Unknown',
                    seats: ride.available_seats,
                    current_members: ride.current_members,
                    owner_id: ride.owner_id,
                    membership_status: ride.membership_status,
                    owner: ride.owner
                }}
                onJoin={async () => loadMyRides}
                showActions={showActions}
                onDelete={handleDeleteRide}
                onEdit={loadMyRides}
                onLeave={showActions ? () => handleLeaveRide(ride.id) : null}
                onTransferOwnership={loadMyRides}
            />
        );
    }

    if (loading) {
        return (
            <div className="page-container">
                <h1>My Rides</h1>
                <p>Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <h1>My Rides</h1>
                <p className="error-message">{error}</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1>My Rides</h1>

            <div className="three-column-layout">
                {/* Created Rides Column - Left */}
                <section className="rides-column">
                    <h2>Created</h2>
                    <div className="column-content">
                        {createdRides.length === 0 ? (
                            <p className="empty-message">No rides created yet.</p>
                        ) : (
                            <div className="column-grid">
                                {createdRides.map(ride => renderRideCard(ride, true))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Joined Rides Column - Middle */}
                <section className="rides-column">
                    <h2>Joined</h2>
                    <div className="column-content">
                        {joinedRides.length === 0 ? (
                            <p className="empty-message">No rides joined yet.</p>
                        ) : (
                            <div className="column-grid">
                                {joinedRides.map(ride => (
                                    <div key={ride.id} className="joined-ride-wrapper">
                                        {renderRideCard(ride, true, 'joined')}
                                        <button
                                            className="btn-cancel-joined"
                                            onClick={() => handleLeaveRide(ride.id)}
                                        >
                                            Leave Ride
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Requested Rides Column - Right */}
                <section className="rides-column">
                    <h2>Requested</h2>
                    <div className="column-content">
                        {pendingRides.length === 0 ? (
                            <p className="empty-message">No pending ride requests.</p>
                        ) : (
                            <div className="column-grid">
                                {pendingRides.map(ride => (
                                    <div key={ride.id} className="pending-ride-wrapper">
                                        {renderRideCard(ride, false)}
                                        <button
                                            className="btn-cancel-pending"
                                            onClick={() => handleCancelPending(ride.id)}
                                        >
                                            Cancel Request
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}