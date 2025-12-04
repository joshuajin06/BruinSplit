import React, { useState, useEffect } from 'react';
import './pages.css';
import Card from '../components/card.jsx';
import SearchBar from '../components/searchBar.jsx';

import { useAuth } from '../context/AuthContext';
import { getMyRides } from '../pages/api/rides';

export default function Postings() {
    const [rides, setRides] = useState([]);
    const [filteredRides, setFilteredRides] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modalError, setModalError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const token = localStorage.getItem('token');
    const { isAuthenticated } = useAuth();

    //fetches rides when component loads
    useEffect(() => {
        fetchRides();
    }, []);

    const [form, setForm] = useState({
        origin_text: '',
        destination_text: '',
        depart_at: '',
        platform: 'LYFT',
        max_seats: 2,
        notes: ''
    });

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
            
            const ridesArray = data.rides || data || [];
            const myRidesResponse = await getMyRides();
            const myRidesArray = myRidesResponse.rides || [];
            const filteredArr = ridesArray.filter(rides => !myRidesArray.some(myRide => myRide.id === rides.id))

            setRides(ridesArray);
            setFilteredRides(filteredArr);
        } catch (err) {
            console.error('fetchRides error:', err);
            setError(err.message || 'Failed to load rides');
        } finally {
            setLoading(false);
        }
    }

    const removeRideFromState = async (deletedId) => {
    // This updates the UI instantly by filtering out the deleted item
    setRides(currentRides => currentRides.filter(ride => ride.id !== deletedId));
    await fetchRides();
    };
    
    const handleSearch = (searchQuery) => {
        if (!searchQuery.trim()) {
            setFilteredRides(rides);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = rides.filter(ride => {
            const origin = ride.origin_text?.toLowerCase() || '';
            const destination = ride.destination_text?.toLowerCase() || '';
            const combinedText = `${origin} to ${destination}`;
            
            return origin.includes(query) || 
                   destination.includes(query) || 
                   combinedText.includes(query);
        });
        
        setFilteredRides(filtered);
    };

    return (
    <>
        <div className="page-container">
            <section className='posts-title-section'>
                <h1>Posts</h1>
                {isAuthenticated && <button className='add-post' onClick={() => setShowModal(!showModal)}><a>+</a></button>}
            </section>
            
            <div style={{ marginBottom: '24px', width: '60%', maxWidth: '1200px', margin: '0 auto 24px auto' }}>
                <SearchBar onSearch={handleSearch} />
            </div>

            {loading && <p>Loading rides...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && rides.length === 0 && <p>No rides available.</p>}
            {!loading && rides.length > 0 && filteredRides.length === 0 && (
                <p>No rides match your search.</p>
            )}
            <div className='card-grid'> 
                {filteredRides.map(ride => (
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
                            current_members: ride.current_members,  // number currently joined
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