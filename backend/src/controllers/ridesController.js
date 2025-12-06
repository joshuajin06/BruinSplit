import { supabase } from '../supabase.js';
import { createRide, enrichRide, joinRideService, deleteRideService, leaveRideService, getMyRidesService, updateRideService, getPendingRequestsService, approveRideRequestService, rejectRideRequestService, kickMemberService, getMyPendingRidesService, transferOwnershipService } from '../services/rideService.js';


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


// POST /api/rides/:id/approve/:userId - approve a pending request to join a ride (owner only)
export async function approveRequest(req, res, next) {
    try {
        const { id: rideId, userId: requesterUserId } = req.params;
        const ownerId = req.user.id;

        if (!rideId || !requesterUserId) {
            return res.status(400).json({ error: 'Ride ID and User ID are required' });
        }

        const approvedMember = await approveRideRequestService(rideId, requesterUserId, ownerId);

        return res.status(200).json({
            message: 'Request approved successfully',
            member: approvedMember
        });

    } catch (error) {
        console.error('Approve request error:', error);
        next(error);
    }
}

// POST /api/rides/:id/reject/:userId - reject a pending request to join a ride (owner only)
export async function rejectRequest(req, res, next) {
    try {
        const { id: rideId, userId: requesterUserId } = req.params;
        const ownerId = req.user.id;

        if (!rideId || !requesterUserId) {
            return res.status(400).json({ error: 'Ride ID and User ID are required' });
        }

        const result = await rejectRideRequestService(rideId, requesterUserId, ownerId);

        return res.status(200).json(result);

    } catch (error) {
        console.error('Reject request error:', error);
        next(error);
    }
}

// POST /api/rides/:id/transfer-ownership/:userId - transfer ride ownership to another confirmed member
export async function transferOwnership(req, res, next) {
    try {
        const { id: rideId, userId: newOwnerUserId } = req.params;
        const currentOwnerId = req.user.id;

        if (!rideId || !newOwnerUserId) {
            return res.status(400).json({ error: 'Ride ID and new owner user ID are required' });
        }

        const result = await transferOwnershipService(rideId, newOwnerUserId, currentOwnerId);

        return res.status(200).json({
            message: 'Ride ownership transferred successfully',
            data: result
        })

    } catch (error) {
        console.error('Transfer ownership error:', error);
        next(error);
    }
}


// DELETE /api/rides/:id - delete a ride
export async function deleteRide(req, res, next) {
    try {

        const { id: rideId } = req.params;

        const userId = req.user.id;

        if (!rideId) {
            return res.status(400).json({ error: 'Ride ID is required' });
        }

        const result = await deleteRideService(rideId, userId);

        return res.status(200).json({
            message: 'Ride deleted successfully'
        });

    } catch (error) {
        console.error('Delete ride error: ', error);
        next(error);
    }
}



// DELETE /api/rides/:id/leave - removes a user from a ride they've joined
export async function leaveRide(req, res, next) {
    try {

        // get rideId from URL parameters
        const { id: rideId } = req.params;

        // get userId, from authenticateUser
        const userId = req.user.id;

        // validate rideId exists
        if (!rideId) {
            return res.status(400).json({ error: 'Ride ID is required' });
        }

        // call service function to delete a user from a ride
        const result = await leaveRideService(rideId, userId);

        return res.status(200).json({
            message: 'Successfully left ride'
        });

    } catch (error) {
        console.error('Leave ride error: ', error);
        next(error);
    }
}


// DELETE /api/rides/:id/kick/:userId - kick a confirmed member of the ride (owner only)
export async function kickMember(req, res, next) {
    try {
        const { id: rideId, userId: memberUserId } = req.params;
        const ownerId = req.user.id;

        if (!rideId || !memberUserId) {
            return res.status(400).json({ error: 'Ride ID and User ID are required' });
        }

        const result = await kickMemberService(rideId, memberUserId, ownerId);

        return res.status(200).json(result);

    } catch (error) {
        console.error('Kick member error:', error);
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
            // pass req.user?.id so the enrichment can include whether the current user is a member
            const userId = req.user?.id;
            const enrichedRides = await Promise.all((rides || []).map(ride => enrichRide(ride, userId)));

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

        const currentUserId = req.user?.id;

        const { data: ride, error } = await supabase
            .from('rides')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        // Determine visibility (owner sees requests, guest only sees confirmed members)
        const isOwner = currentUserId === ride.owner_id;
        const statusesToFetch = isOwner 
            ? ['CONFIRMED JOINING', 'PENDING'] 
            : ['CONFIRMED JOINING'];

        // get ride members (fetch members first, then fetch profiles separately)
        const { data: members, error: membersError } = await supabase
            .from('ride_members')
            .select('id, user_id, status, joined_at')
            .eq('ride_id', id)
            .in('status', statusesToFetch) //fetch based on viewer role
            .order('joined_at', { ascending: true });

        if (membersError) throw membersError;

        // fetch profiles for member user_ids (avoid join projection ambiguity)
        const userIds = (members || []).map(m => m.user_id).filter(Boolean);
        let profilesById = {};
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, first_name, last_name, profile_photo_url')
                .in('id', userIds);
            profilesById = (profiles || []).reduce((acc, p) => {
                acc[p.id] = p; return acc;
            }, {});
        }

        // attach profile info to each member
        const membersWithProfiles = (members || []).map(m => ({
            ...m,
            profile: profilesById[m.user_id] || null
        }));

        // get owner profile
        const { data: owner } = await supabase
            .from('profiles')
            .select('id, username, first_name, last_name, email, phone_number, profile_photo_url')
            .eq('id', ride.owner_id)
            .single();
        
        // Calculate seats based only on confirmed members (Pending don't take seats yet)
        const confirmedCount = members?.filter(m => m.status === 'CONFIRMED JOINING').length || 0;
        const availableSeats = ride.max_seats - confirmedCount;

        res.json({
            message : 'Ride retrieved successfully',
            ride: {
                ...ride,
                available_seats: availableSeats,
                current_members: confirmedCount,
                owner: owner || null,
                members: membersWithProfiles || []
            }
        });
    } catch (error) {
        console.error('Get ride error:', error);
        res.status(500).json({ error: error.message || 'Failed to retreive ride' });
    }
};



// GET /api/rides/:id/pending - get pending requests to join a ride (owner only)
export async function getPendingRequests(req, res, next) {
    try {
        const { id: rideId } = req.params;
        const ownerId = req.user.id;

        if (!rideId) {
            return res.status(400).json({ error: 'Ride ID is required' });
        }

        const pendingRequests = await getPendingRequestsService(rideId, ownerId);

        return res.status(200).json({
            message: 'Pending requests retrieved successfully',
            pending_requests: pendingRequests
        });

    } catch (error) {
        console.error('Get pending requests error:', error);
        next(error);
    }
}





// GET /api/rides/my-rides - get all rides that a user has joined
export async function getMyRides(req, res, next) {
    try {

        const userId = req.user.id;

        const rides = await getMyRidesService(userId);

        return res.status(200).json({
            message: 'My rides retrieved successfully',
            rides: rides
        });

    } catch (error) {
        console.error('Get my rides error: ', error);
        next(error);
    }
}


// GET /api/rides/my-pending - get all rides of which a user has request 'PENDING'
export async function getMyPendingRides(req, res, next) {
    try {
        const userId = req.user.id;
        const rides = await getMyPendingRidesService(userId);

        return res.status(200).json({
            message: 'Pending ride requests retrieved successfully',
            rides: rides
        });
    } catch (error) {
        console.error('Get my pending rides error:', error);
        next(error);
    }
}


// PUT /api/rides/:id - update a ride (owner only)
export async function updateRide(req, res, next) {
    try {

        const { id: rideId } = req.params;

        const userId = req.user.id;

        const { origin_text, destination_text, depart_at, platform, max_seats, notes } = req.body;

        if (!rideId) {
            return res.status(400).json({ error: 'Ride ID is required' });
        }

        const updateData = {};

        // validate origin_text if provided
        if (origin_text !== undefined) {
            if (typeof origin_text !== 'string' || origin_text.trim().length === 0) {
                return res.status(400).json({ error: 'Invalid origin text' });
            }
            updateData.origin_text = origin_text;
        }

        // validate destination_text if provided
        if(destination_text !== undefined) {
            if (typeof destination_text !== 'string' || destination_text.trim().length === 0) {
                return res.status(400).json({ error: 'Invalid destination text' });
            }
            updateData.destination_text = destination_text;
        }

        // validate depart_at if provided
        if (depart_at !== undefined) {
            const departAt = new Date(depart_at);
            if (isNaN(departAt.getTime())) {
                return res.status(400).json({ error: 'Invalid departure time' });
            }
            updateData.depart_at = departAt;
        }

        // validate platform if provided
        if (platform !== undefined) {
            const platformUpper = platform.toUpperCase();
            if (!['UBER', 'WAYMO', 'LYFT', 'OTHER'].includes(platformUpper)) {
                return res.status(400).json({ error: 'Invalid platform. Please choose from UBER, WAYMO, LYFT, or OTHER' });
            }
            updateData.platform = platformUpper;
        }

        // validate max_seats if provided
        if (max_seats !== undefined) {
            const maxSeats = parseInt(max_seats);
            if (isNaN(maxSeats) || maxSeats < 2 || maxSeats > 6) {
                return res.status(400).json({ error: 'Number of available seats must be between 2 and 6 inclusive' });
            }
            updateData.max_seats = maxSeats;
        }
        
        // Validate notes if provided (optional, can be null or string)
        if (notes !== undefined) {
            if (notes !== null && typeof notes !== 'string') {
                return res.status(400).json({ error: 'Notes must be a string or null' });
            }
            updateData.notes = notes;
        }

        // call service to update ride
        const updatedRide = await updateRideService(rideId, userId, updateData);

        return res.status(200).json({
            message: 'Ride updated successfully',
            ride: updatedRide
        });

    } catch (error) {
        console.error('Update ride error: ', error);
        next(error);
    }
}