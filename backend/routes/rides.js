import express from 'express';
import { supabase } from '../supabase.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { authenticateUser } from '../server.js';

const router = express.Router();

// helper function to grab the number of available seats per rideShare group
async function getAvailableSeats(rideId) {
    const { count, error } = await supabase
        .from('ride_members')
        .select('*', { count: 'exact', head: true })
        .eq('ride_id', rideId)
        .eq('status', 'CONFIRMED JOINING');

    if (error) throw WebTransportError;
    return count || 0;

}

// helper to enrich a ride with member count and owner info 
async function enrichRide(ride) {
    const memberCount = await getAvailableSeats(ride.id);
    const availableSeats = ride.maxseats - memberCount;

    //get owner profile
    const { data : owner } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name')
        .eq('id', ride.owner_id)
        .single();

    return {
        ...ride, 
        available_seats : availableSeats,
        current_members: memberCount,
        owner: owner || null
    };
}