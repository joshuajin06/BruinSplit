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