import React, { useState, useEffect } from 'react';
import './pages.css';
import Card from '../components/card.jsx';
import { getRides } from './api/rides.js';

export default function Postings() {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch rides when page loads
    useEffect(() => {
        loadRides();
    }, []);

    async function loadRides() {
        setLoading(true);
        setError(null);
        try {
            const response = await getRides();
            const ridesData = response.rides || [];
            setRides(ridesData);
        } catch (err) {
            console.error('Error loading rides:', err);
            setError(err.response?.data?.error || err.message || 'Failed to load rides');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="page-container">
                <h1>Posts</h1>
                <p>Loading rides...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <h1>Posts</h1>
                <p className="error">{error}</p>
                <button onClick={loadRides}>Try Again</button>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1>Posts</h1>
            {rides.length === 0 ? (
                <p>No rides available</p>
            ) : (
                <div className='card-grid'>
                    {rides.map(ride => (
                        <Card
                            key={ride.id}
                            ride={ride}  // Pass the full ride object
                            title={`${ride.origin_text} → ${ride.destination_text}`}
                            content={ride.description || ride.notes || 'No description'}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}