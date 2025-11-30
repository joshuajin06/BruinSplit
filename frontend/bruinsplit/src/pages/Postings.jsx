import React, { useState, useEffect } from 'react';
import './pages.css';
import Card from '../components/card.jsx';

export default function Postings() {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modalError, setModalError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const isAuthenticated = !!user && !!token;

    //fetches rides when component loads
    useEffect(() => {
        fetchRides();
    }, []);

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
            setRides(ridesArray);
        } catch (err) {
            console.error('fetchRides error:', err);
            setError(err.message || 'Failed to load rides');
        } finally {
            setLoading(false);
        }
    }

    return (
    <>
        <div className="page-container">
            <section className='posts-title-section'>
                <h1>Posts</h1>
                {isAuthenticated && <button className='add-post' onClick={() => setShowModal(!showModal)}><a>+</a></button>}
            </section>
            {loading && <p>Loading rides...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && rides.length === 0 && <p>No rides available.</p>}
            <div className='card-grid'> 
                {rides.map(ride => (
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
                        rideDetails={{
                            driver: ride.owner?.first_name ? `${ride.owner.first_name} ${ride.owner.last_name}` : 'Unknown',
                            seats: ride.available_seats,            // total available seats after enrichment (available_seats)
                            current_members: ride.current_members,  // number currently joined
                            isMember: ride.is_member
                        }}
                        onJoin={async (joinedRideId) => {
                        // re-fetch all rides
                        await fetchRides();
                        }}
                    /> 
                ))}
          </div>
        </div>
    </>
    );
}