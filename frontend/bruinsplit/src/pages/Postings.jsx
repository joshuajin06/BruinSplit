import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './pages.css';
import Card from '../components/card.jsx';
import SearchBar from '../components/searchBar.jsx';
import { useSearchParams } from 'react-router-dom';
import SkeletonCard from '../components/SkeletonCard.jsx';

import { useAuth } from '../context/AuthContext';
import { getMyRides, getRides } from '../pages/api/rides';
import { getFriends } from '../pages/api/friends.js';

export default function Postings() {
    const [rides, setRides] = useState([]);
    const [availableRides, setAvailableRides] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalError, setModalError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const token = localStorage.getItem('token');
    const [searchParams, setSearchParams] = useSearchParams();
    const initialSearchQuery = searchParams.get('q') || '';
    const { user, isAuthenticated } = useAuth();

    const [showFriendsOnly, setShowFriendsOnly] = useState(false);
    const [friends, setFriends] = useState([]);

    const [form, setForm] = useState({
        origin_text: '',
        destination_text: '',
        depart_at: '',
        platform: 'LYFT',
        max_seats: 2,
        notes: ''
    });

    useEffect(() => {
        if (isAuthenticated) {
            getFriends()
                .then(friendsData => {
                    const friendIds = (friendsData.friends || []).map(f => String(f.id));
                    setFriends(friendIds);
                })
                .catch(err => console.error('Failed to fetch friends:', err));
        }
    }, [isAuthenticated]);

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setModalError(null);

        // basic validation
        if (!form.origin_text || !form.destination_text || !form.depart_at) {
            setModalError('Please provide origin, destination and departure time');
            return;
        }

        const payload = {
            origin_text: form.origin_text,
            destination_text: form.destination_text,
            depart_at: new Date(form.depart_at).toISOString(),
            platform: form.platform,
            max_seats: parseInt(form.max_seats, 10),
            notes: form.notes
        };

        try {
            const res = await fetch('/api/rides', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const text = await res.text().catch(() => '');
                let parsed = null;
                try { parsed = JSON.parse(text); } catch (_) {}
                throw new Error(parsed?.error || parsed?.message || text || `Create failed: ${res.status}`);
            }

            const data = await res.json();
            const newRideId = data.ride?.id;

            // Auto-join the ride the user just created
            if (newRideId) {
                const joinRes = await fetch(`/api/rides/${newRideId}/join`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    }
                });
                if (!joinRes.ok) {
                    console.warn('Auto-join failed, but ride was created:', joinRes.status);
                }
            }

            // success, refresh rides and close modal
            await fetchRides();
            setForm({ origin_text: '', destination_text: '', depart_at: '', platform: 'LYFT', max_seats: 2, notes: '' });
            setShowModal(false);
        } catch (err) {
            console.error('create ride error:', err);
            setModalError(err.message || 'Failed to create ride');
        }
    }

    async function fetchRides() {
        let ridesArray = [];
        setLoading(true);
        setError(null);
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await fetch('/api/rides', { headers });
            if (!res.ok) {
                // try to read text for debugging (server may return HTML)
                const text = await res.text().catch(() => '');
                throw new Error(`Fetch failed: ${res.status} - ${text.slice(0, 300)}`);
            }

            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const text = await res.text().catch(() => '');
                throw new Error(`Expected JSON but received: ${contentType} \n${text.slice(0, 300)}`);
            }
            const data = await res.json();
            // Extract rides array from response (controller returns { message, rides })

            ridesArray = data.rides || data || [];
            const myRidesResponse = await getMyRides();
            const myRidesArray = myRidesResponse.rides || [];
            const availableRidesArray = ridesArray.filter(rides => !myRidesArray.some(myRide => myRide.id === rides.id))

            setRides(ridesArray);
            setAvailableRides(availableRidesArray);
            // setFilteredRides(availableRidesArray);
        } catch (err) {
            console.error('fetchRides error:', err);
            setError(err.message || 'Failed to load rides');
        } finally {
            setLoading(false);
            return ridesArray;
        }
    }

    const removeRideFromState = async (deletedId) => {
    // This updates the UI instantly by filtering out the deleted item
    setRides(currentRides => currentRides.filter(ride => ride.id !== deletedId));
    await fetchRides();
    };
    
    const filteredRides = useMemo(() => {
        let currentRides = [...availableRides];

        if (showFriendsOnly) {
            currentRides = currentRides.filter(ride => {
                // Check if the ride owner is a friend
                if (friends.includes(ride.owner_id)) {
                    return true;
                }

                // Check if any member of the ride is a friend
                // This assumes `ride.current_members` is an array of user objects with an `id` property.
                if (ride.current_members && Array.isArray(ride.current_members)) {
                    return ride.current_members.some(member => friends.includes(String(member.id)));
                }

                return false;
            });
        }

        const query = searchParams.get('q') || '';
        if (query.trim()) {
            const lowerCaseQuery = query.toLowerCase();
            currentRides = currentRides.filter(ride => {
                const origin = ride.origin_text?.toLowerCase() || '';
                const destination = ride.destination_text?.toLowerCase() || '';
                const combinedText = `${origin} to ${destination}`;

                return origin.includes(lowerCaseQuery) ||
                    destination.includes(lowerCaseQuery) ||
                    combinedText.includes(lowerCaseQuery);
            });
        }
        
        return currentRides;
    }, [availableRides, showFriendsOnly, friends, searchParams]);

    const handleSearch = (searchQuery) => {
        if (searchQuery.trim()) {
            setSearchParams({ q: searchQuery });
        } else {
            setSearchParams({});
        }
    };

    // Fetch rides on component mount and when initialSearchQuery changes
    useEffect(() => {
        async function loadRides() {
            setLoading(true);
            setInitialLoading(true);
            try {
                const data = await getRides();
                const ridesArray = data.rides || data || [];
                const myRidesResponse = await getMyRides();
                const myRidesArray = myRidesResponse.rides || [];
                const availableRidesArray = ridesArray.filter(ride => !myRidesArray.some(myRide => myRide.id === ride.id) && ride.owner_id !== user?.id);

                setRides(ridesArray);
                setAvailableRides(availableRidesArray);

            } catch (err) {
                console.error('fetchRides error:', err);
                setError(err.message || 'Failed to load rides');
            } finally {
                setLoading(false);
                setInitialLoading(false);
            }
        }
        loadRides();
    }, [initialSearchQuery, user]);

    return (
    <>
        <div className="page-container">
            <section className='posts-title-section'>
                <h1>Posts</h1>
                {isAuthenticated && <button className='add-post' onClick={() => setShowModal(!showModal)}><a>+</a></button>}
            </section>
            
            <div style={{ marginBottom: '24px', width: '60%', maxWidth: '1200px', margin: '0 auto 24px auto' }}>
                <SearchBar onSearch={handleSearch} initialValue={initialSearchQuery} />
                {isAuthenticated && (
                    <div style={{ marginTop: '10px' }}>
                        <button
                            className="friends-filter-button"
                            onClick={() => setShowFriendsOnly(prev => !prev)}
                        >
                            {showFriendsOnly ? 'See all rides' : 'See what your friends are up to...'}
                        </button>
                    </div>
                )}
            </div>

            {error && <p className="error-message">{error}</p>}

            {initialLoading && (
                <div className='card-grid'>
                    {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            )}

            {!initialLoading && rides.length > 0 && availableRides.length === 0 && (
                 <div className="empty-message" style={{marginTop: '2rem'}}>
                    <p>No new rides are available. Check out My Rides to see the rides you own and are a member of.</p>
                </div>
            )}

            {!initialLoading && rides.length === 0 && (
                <div className="empty-message" style={{marginTop: '2rem'}}>
                    <p>No rides have been posted yet. Be the first to create one!</p>
                </div>
            )}


            <div className='card-grid'>
                {!initialLoading && filteredRides.map(ride => (
                    <Card key={ride.id}
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
                        onDelete={removeRideFromState}
                        onTransferOwnership={async (joinedRideId, newOwnerId) => {
                            // re-fetch all rides
                            await fetchRides();
                        }}
                        rideDetails={{
                            driver: ride.owner?.first_name ? `${ride.owner.first_name} ${ride.owner.last_name}` : 'Unknown',
                            seats: ride.available_seats,            // total available seats after enrichment (available_seats)
                            current_members: ride.current_members,  // array of user objects for members
                            owner_id: ride.owner_id,                // needed for riders tab to show owner badge
                            membership_status: ride.membership_status  // null, 'PENDING', or 'CONFIRMED JOINING'
                        }}
                        onJoin={async (joinedRideId) => {
                            // re-fetch all rides
                            await fetchRides();
                        }}
                        onLeave={async (leftRideId) => {
                            await fetchRides();
                        }}

                        onEdit={ async (editedRideId) => {
                            await fetchRides();
                        }}
                    />
                ))}

                {!initialLoading && availableRides.length > 0 && filteredRides.length === 0 && (
                    <div className="empty-message" style={{gridColumn: '1 / -1'}}>
                        <p>No rides match your search or filter.</p>
                    </div>
                )}
          </div>
        </div>
            {showModal && isAuthenticated && (
                <section className="ride-form" onClick={() => setShowModal(false)}>
                    <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
                        <button 
                            className="modal-close" 
                            onClick={() => setShowModal(false)}
                            aria-label="Close modal" 
                            type="button">
                        ×
                        </button>
                        <h2>Create Ride</h2>
                        {modalError && <p className="error">{modalError}</p>}

                        <label>
                            Origin
                            <input name="origin_text" value={form.origin_text} onChange={handleChange} />
                        </label>

                        <label>
                            Destination
                            <input name="destination_text" value={form.destination_text} onChange={handleChange} />
                        </label>

                        <label>
                            Departure
                            <input name="depart_at" type="datetime-local" value={form.depart_at} onChange={handleChange} />
                        </label>

                        <label>
                            Platform
                            <select name="platform" value={form.platform} onChange={handleChange}>
                                <option>LYFT</option>
                                <option>UBER</option>
                                <option>WAYMO</option>
                                <option>OTHER</option>
                            </select>
                        </label>

                        <label>
                            Max Seats
                            <input name="max_seats" type="number" min="2" max="6" value={form.max_seats} onChange={handleChange} />
                        </label>

                        <label>
                            Notes
                            <textarea name="notes" value={form.notes} onChange={handleChange} />
                        </label>

                        <div className="form-actions">
                            <button type="submit">Create</button>
                            <button type="button" onClick={() => setForm({ origin_text: '', destination_text: '', depart_at: '', platform: 'LYFT', max_seats: 2, notes: '' })}>Reset</button>
                        </div>
                    </form>
                </section>
            )}
    </>
    );
}