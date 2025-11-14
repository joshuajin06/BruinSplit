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

// GET /api/rides - get all rides with an optional filter
router.get('/', async (req, res) => {
    try {
        const { origin, destination, platform, min_seats } = req.query;

        let query = supabase
            .from('rides')
            .select('*')
            .order('created_at', { ascending: false });

            // apply filters if used
            if (origin) {
                query = query.ilike('origin_text', '%${origin}%');
            }
            if (destination) {
                query.ilike('origin_text', '%${origin}%');
            }
            if (platform) {
                const platformUpper = platform.toUpperCase();
                if (['UBER', 'LYFT', 'WAYMO', 'OTHER'].includes(platformUpper)) {
                    query = query.eq('platform', platformUpper);
                }
            }

            const { data: rides, error } = await query;

            if (error) throw error;

            // enrich each ride with available seats and owner info using helper function defined above
            const enrichedRides = await Promise.all((rides || []).map(ride => enrichRide(ride)));

            // filter by min_seats if provided (after calculating the available seats)
            const filteredRides = min_seats
                ? enrichedRides.filter(ride => ride.available_seats >= parseInt(min_seats)) : enrichedRides;

            res.json({
                message: 'Rides retrieved successfully',
                rides: filteredRides
            });

    } catch (error) {
        console.error('Get rides error:', error);
        res.status(500).json({ error: error.message || 'Failed to retrieve rides' });
    }
});