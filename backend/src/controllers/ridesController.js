import { supabase } from '../supabase.js';
import { createRide, enrichRide, getAvailableSeats, joinRideService } from '../services/rideService.js';


// POST /api/rides - create a rideShare group
export async function postRide(req, res, next) {
    try {
        
        // extract data from req
        const { origin_text, destination_text, depart_at, platform, max_seats, notes } = req.body;

        // get owner id from authenticated user 
        const owner_id = req.user.id;


        if ( !owner_id || !origin_text || !destination_text || !depart_at || !platform || !max_seats ) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const departAt = new Date(depart_at);

        if (isNaN(departAt.getTime())) {
            return res.status(400).json({ error: "Invalid departure time." });
        }

        const maxSeats = parseInt(max_seats);
        if (isNaN(maxSeats) || maxSeats < 2 || maxSeats > 6) {
            return res.status(400).json({ error: "Number of available seats must be between 2 and 6 inclusive." });
        }
 
        const platformUpper =  platform?.toUpperCase();
        if (!['UBER', 'WAYMO', 'LYFT', 'OTHER'].includes(platformUpper)) {
            return res.status(400).json({ error: "Invalid platform. Please choose from UBER, WAYMO, LYFT, or OTHER (specify in notes if OTHER)." });
        }

        if (typeof origin_text !== 'string' || typeof destination_text !== 'string') {
            return res.status(400).json({ error: "Please provide a valid destination and origin." });
        }

        const ride = await createRide({
            owner_id, 
            origin_text, 
            destination_text, 
            departAt, 
            platformUpper, 
            maxSeats, 
            notes
        });

        return res.status(201).json({ 
            message: "Ride created successfully.",
            ride: ride
        });

    } catch (error) {
        console.error("Post ride error: ", error);
        next(error);
    }
}

// POST /api/rides/:id/join - join a ride
export async function joinRide(req, res, next) {

    try {

        const { id: rideId } = req.params;

        const userId = req.user.id;

        if (!rideId) {
            return res.status(400).json({ error: 'Ride ID is required' });
        }

        const member = await joinRideService(rideId, userId);

        return res.status(201).json({
            message: 'Successfully joined ride',
            member: member
        });

    } catch (error) {
        console.error("Error in joining ride: ", error);
        next(error);
    }

}

// GET /api/rides - get all rides with an optional filter
export async function getRides(req, res) {
    try {
        const { origin, destination, platform, min_seats } = req.query;

        let query = supabase
            .from('rides')
            .select('*')
            .order('created_at', { ascending: false });

            // apply filters if used
            if (origin) {
                query = query.ilike('origin_text', `%${origin}%`);
            }
            if (destination) {
                query =query.ilike('destination_text', `%${destination}%`);
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
};

// GET /api/rides:id - get a specfic ride by ID with members
export async function getRideById(req, res) {
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
};