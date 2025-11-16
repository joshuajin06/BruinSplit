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

// GET /api/rides:id - get a specfic ride by ID with members
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: ride, error } = await supabase
            .from('rides')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        // get ride members
        const { data: members, error: membersError } = await supabase
            .from('ride_members')
            .select('id, user_id, status, joined_at, profile:profile!ride_members_user_id_fkey(id, username, first_name, last_name)')
            .eq('ride_id', id)
            .eq('status', 'CONFIRMED JOINING')
            .order('joined_at', { ascending: true });
        
        if (membersError) throw membersError;

        // get owner profile
        const { data: owner } = await supabase
            .from('profiles')
            .select('id, username, first_name, last_name')
            .eq('id', ride.owner_id)
            .single();
        
        const memberCount = members?.length || 0;
        const availableSeats = ride.max_seats - memberCount;

        res.json({
            message : 'Ride retrieved successfully',
            ride: {
                ...ride,
                available_seats: availableSeats,
                current_members: memberCount,
                owner: owner || null,
                members: members || []
            }
        });
    } catch (error) {
        console.error('Get ride error:', error);
        res.status(500).json({ error: error.message || 'Failed to retreive ride' });
    }
});