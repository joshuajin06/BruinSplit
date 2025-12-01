import React, { useState, useEffect } from 'react';
import './pages.css';
import { getMyRides, deleteRide, leaveRide } from './api/rides.js';


export default function MyRides() {
    
    // set variables to hold data and UI state
     const [ownedRides, setOwnedRides] = useState([]);
     const [joinedRides, setJoinedRides] = useState([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);

     useEffect( () => {
        loadMyRides();
     }, []);

     // call backend API
     async function loadMyRides() {
        setLoading(true);
        setError(null);

        try {

            // call API function from api/rides.js
            const response = await getMyRides();
    
            const allRides = response.rides || [];
    
            // filter based on user_role field from backend
    
            const owned = allRides.filter(ride =>
                ride.user_role === 'owner' || ride.user_role === 'owner_and_member'
            );
    
            const joined = allRides.filter(ride =>
                ride.user_role === 'member'
            );
    
            // update state with separated rides
            setOwnedRides(owned);
            setJoinedRides(joined);
    
        } catch (err) {
            console.error('Error loading rieds:', err);
            setError(err.response?.data?.error || err.message || 'Failed to load rides');
        } finally {
            setLoading(false);
        }

     }

     async function handleDeleteRide(rideId) {
        // confirm before deleting ride
        if (!window.confirm('Are you sure you want to delete this ride?')) {
            return; // user cancelled ride deletion
        }

        try {
            await deleteRide(rideId);
            setOwnedRides(prev => prev.filter(ride => ride.id !== rideId));
            setJoinedRides(prev => prev.filer(ride => ride.id !== rideId));
        } catch (err) {
            console.error('Error deleting ride:', err);
            alert(err.response?.data?.error || 'Failed to delete ride');
        }
     }

     async function handleLeaveRide(rideId) {
        if(!window.confirm('Are you sure you want to leave this ride?')) {
            return;
        }

        try {
            await leaveRide(rideId);
            // remove from joined rides
            setJoinedRides(prev => prev.filter(ride => ride.id !== rideId));
        } catch (err) {
            console.error('Error leaving ride:', err);
            alert(err.response?.data?.error || 'Failed to leave ride');
        }
     }


}