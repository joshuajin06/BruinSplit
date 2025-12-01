import { supabase } from '../supabase.js';




// helper function to create a ride
export async function createRide(rideData) {

    const { owner_id, origin_text, destination_text, departAt, platformUpper, maxSeats, notes } = rideData;

    const { data : ride, error } = await supabase
        .from('rides')
        .insert([{
            owner_id: owner_id,
            origin_text : origin_text, 
            destination_text: destination_text,
            depart_at: departAt,
            platform: platformUpper,
            max_seats: maxSeats,
            notes: notes
        }])
        .select('*')
        .single()
    
    if (error) {
        error.statusCode = 400;
        throw error;
    }

    return ride;
}





// helper function to add a user to a ride
export async function joinRideService(rideId, userId) {

    // query rides table to check if ride even exists
    const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('id, max_seats, owner_id')
        .eq('id', rideId)
        .single();

    // throw error if : error OR ride doesn't exist
    if (rideError || !ride) {
        const error = new Error('Ride not found');
        error.statusCode = 404;
        throw error;
    }

    // use helper to count current ride members
    const currentMembers = await getAvailableSeats(rideId);

    const availableSeats = ride.max_seats - currentMembers;

    // throw error if no seats are available
    if (availableSeats <= 0) {
        const error = new Error('Ride is full');
        error.statusCode = 400;
        throw error;
    }

    // query ride_members to see if the user is already in this ride (PENDING or CONFIRMED)
    const { data: existingMember } = await supabase
        .from('ride_members')
        .select('id, status')
        .eq('ride_id', rideId)
        .eq('user_id', userId)
        .in('status', ['PENDING', 'CONFIRMED JOINING'])
        .maybeSingle();

    // throw error if user already has a request or is confirmed
    if (existingMember) {
        const statusMsg = existingMember.status === 'PENDING'
            ? 'You already have a pending request to join this ride'
            : 'User already joined ride';
        const error = new Error(statusMsg);
        error.statusCode = 400;
        throw error;
    }

    // insert new member into ride_members table
    const { data: member, error: insertError } = await supabase
        .from('ride_members')
        .insert([{
            ride_id: rideId,
            user_id: userId,
            status: 'PENDING'
        }])
        .select('*')
        .single();

    if (insertError) {
        insertError.statusCode = 400;
        throw insertError;
    }

    return member;
}

// get all pending requests for a ride (owner only)
export async function getPendingRequestsService(rideId, ownerId) {
    // verify the ride exists and that the user is the owner
    const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('id, owner_id')
        .eq('id', rideId)
        .single()
    
    if (rideError || !ride) {
        const error = new Error('Ride not found');
        error.statusCode = 404;
        throw error;
    }

    if (ride.owner_id !== ownerId) {
        const error = new Error('Unauthorized: Only the ride owner can view pending requests');
        error.statusCode = 403;
        throw error;
    }

    // get all pending requests with user profiles
    const { data: pendingRequests, error } = await supabase
        .from('ride_members')
        .select(`
            id,
            user_id,
            status,
            joined_at,
            profile:profiles!ride_members_user_id_fkey(
                id,
                username,
                first_name,
                last_name,
                email,
                phone_number
            )
        `)
        .eq('ride_id', rideId)
        .eq('status', 'PENDING')
        .order('joined_at', { ascending: true });

    if (error) {
        error.statusCode = 400;
        throw error;
    }

    return pendingRequests || [];

}

// function for owner approving a pending request
export async function approveRideRequestService(rideId, requesterUserId, ownerId) {

    // verify ride exists and that user is the owner
    const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('id, owner_id, max_seats')
        .eq('id', rideId)
        .single();

    if (rideError || !ride) {
        const error = new Error('Ride not found');
        error.statusCode = 404;
        throw error;
    }

    if (ride.owner_id !== ownerId) {
        const error = new Error('Unauthorized: Only the ride owner can approve requests');
        error.statusCode = 403;
        throw error;
    }

    // check if the request exists and is PENDING
    const { data: pendingRequest, error: requestError } = await supabase
        .from('ride_members')
        .select('id, status')
        .eq('ride_id', rideId)
        .eq('user_id', requesterUserId)
        .eq('status', 'PENDING')
        .maybeSingle();

    if (requestError) {
        requestError.statusCode = 400;
        throw requestError;
    }

    if (!pendingRequest) {
        const error = new Error('Pending request not found');
        error.statusCode = 404;
        throw error;
    }

    // check if ride has available seats
    const currentMembers = await getAvailableSeats(rideId);
    const availableSeats = ride.max_seats - currentMembers;

    if (availableSeats <= 0) {
        const error = new Error('Ride is full');
        error.statusCode = 400;
        throw error;
    }

    // update status from PENDING to CONFIRMED JOINING
    const { data: approvedMember, error: updateError } = await supabase
        .from('ride_members')
        .update({ status: 'CONFIRMED JOINING' })
        .eq('id', pendingRequest.id)
        .select('*')
        .single();
    
    
    if (updateError) {
        updateError.statusCode = 400;
        throw updateError;
    }

    return approvedMember;
}

// function for owner rejecting a pending request
export async function rejectRideRequestService(rideId, requesterUserId, ownerId) {

     // verify ride exists and that user is owner
     const { data: ride, error: rideError } = await supabase
     .from('rides')
     .select('id, owner_id')
     .eq('id', rideId)
     .single();

    if (rideError || !ride) {
        const error = new Error('Ride not found');
        error.statusCode = 404;
        throw error;
    }

    if (ride.owner_id !== ownerId) {
        const error = new Error('Unauthorized: Only the ride owner can reject requests');
        error.statusCode = 403;
        throw error;
    }

    // Check if request exists and is PENDING
    const { data: pendingRequest, error: requestError } = await supabase
        .from('ride_members')
        .select('id, status')
        .eq('ride_id', rideId)
        .eq('user_id', requesterUserId)
        .eq('status', 'PENDING')
        .maybeSingle();

    if (requestError) {
        requestError.statusCode = 400;
        throw requestError;
    }

    if (!pendingRequest) {
        const error = new Error('Pending request not found');
        error.statusCode = 404;
        throw error;
    }

    // delete the pending request
    const { error: deleteError } = await supabase
        .from('ride_members')
        .delete()
        .eq('id', pendingRequest.id);
    
    if (deleteError) {
        deleteError.statusCode = 400;
        throw deleteError;
    }

    return { message: 'Request rejected successfully' };
}


// function for owner kicking out a confirmed member from the ride
export async function kickMemberService(rideId, memberUserId, ownerId) {

    // verify ride exists and user is owner
    const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('id, owner_id')
        .eq('id', rideId)
        .single();

    if (rideError || !ride) {
        const error = new Error('Ride not found');
        error.statusCode = 404;
        throw error;
    }

    if (ride.owner_id !== ownerId) {
        const error = new Error('Unauthorized: Only the ride owner can kick members');
        error.statusCode = 403;
        throw error;
    }

    // prevent the owner from kicking themselves 
    if (memberUserId === ownerId) {
        const error = new Error('Cannot kick yourself from your own ride');
        error.statusCode = 400;
        throw error;
    }

    // check if the member exists and is CONFIRMED (actaully in the ride)
    const { data: member, error: memberError } = await supabase
        .from('ride_members')
        .select('id, status')
        .eq('ride_id', rideId)
        .eq('user_id', memberUserId)
        .eq('status', 'CONFIRMED JOINING')
        .maybeSingle();

    if (memberError) {
        memberError.statusCode = 400;
        throw memberError;
    }

    if (!member) {
        const error = new Error('Member not found or not confirmed');
        error.statusCode = 404;
        throw error;
    }

    // delete the member from the ride
    const { error: deleteError } = await supabase
        .from('ride_members')
        .delete()
        .eq('id', member.id);

    if (deleteError) {
        deleteError.statusCode = 400;
        throw deleteError;
    }

    return { message: 'Member kicked successfully' };
}


// helper function to delete a ride
export async function deleteRideService(rideId, userId) {
    
    // query rides table to check if the ride even exists
    const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('id, owner_id')
        .eq('id', rideId)
        .single();

    // if error OR ride does not exist, throw error
    if (rideError || !ride) {
        const error = new Error('Ride not found');
        error.statusCode = 404;
        throw error;
    }

    // authorization check - is this user the owner of the ride ?
    if (ride.owner_id !== userId) {
        const error = new Error('Unauthorized: You can may only delete the ride if you are the owner');
        error.statusCode = 403;
        throw error;
    }

    // delete all ride members first - prevent orphaned records
    const { error: membersDeleteError } = await supabase
        .from('ride_members')
        .delete()
        .eq('ride_id', rideId);

    if(membersDeleteError) {
        membersDeleteError.statusCode = 400;
        throw membersDeleteError;
    }

    // delete the ride itself
    const { error: deleteError } = await supabase
        .from('rides')
        .delete()
        .eq('id', rideId);

    if (deleteError) {
        deleteError.statusCode = 400;
        throw deleteError;
    }

    return { message: 'Ride has been deleted successfully' };
}


// helper function to remove a user from a ride they've joined
export async function leaveRideService(rideId, userId) {

    // query rides table to check if ride even exists
    const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('id')
        .eq('id', rideId)
        .single();

    // throw error if : error OR ride doesn't exist
    if (rideError || !ride) {
        const error = new Error('Ride not found');
        error.statusCode = 404;
        throw error;
    }
    
    // check if user is in that ride
    const { data: existingMember } = await supabase
        .from('ride_members')
        .select('id')
        .eq('ride_id', rideId)
        .eq('user_id', userId)
        .maybeSingle();

    // if the user is NOT in the ride, throw error
    if (!existingMember) {
        const error = new Error('User is not a member of this ride');
        error.statusCode = 400;
        throw error;
    }

    // remove user from ride_members table
    const { error: deleteError } = await supabase
        .from('ride_members')
        .delete()
        .eq('ride_id', rideId)
        .eq('user_id', userId)

    // throw error if deletion was not successful
    if (deleteError) {
        deleteError.statusCode = 400;
        throw deleteError;
    }
    
    return { message: 'Successfully left ride' };

}


// helper to enrich a ride with member count and owner info 
export async function enrichRide(ride) {
    const memberCount = await getAvailableSeats(ride.id);
    const availableSeats = ride.max_seats - memberCount;

    //get owner profile
    const { data : owner } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, phone_number')
        .eq('id', ride.owner_id)
        .single();

    return {
        ...ride, 
        available_seats : availableSeats,
        current_members: memberCount,
        owner: owner || null
    };
}



// helper function to get all of a user's rides (created + joined)
export async function getMyRidesService(userId) {

    // get rides where the user is the owner
    const { data: ownedRides, error: ownedError } = await supabase
        .from('rides')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });
    
    if (ownedError) {
        ownedError.statusCode = 400;
        throw ownedError;
    }

    // get rides where user is a member

    // first, get all ride_ids where user is a member
    const { data: memberRecords, error: memberError } = await supabase
        .from('ride_members')
        .select('ride_id')
        .eq('user_id', userId)
        .eq('status', 'CONFIRMED JOINING');

    if (memberError) {
        memberError.statusCode = 400;
        throw memberError;
    }

    // then extract just the ride_ids from memberRecords
    const joinedRideIds = (memberRecords || []).map(record => record.ride_id);

    // then, get the actual ride data for joined rides
    let joinedRides = [];
    if (joinedRideIds.length > 0) {
        const { data: joinedRidesData, error: joinedError } = await supabase
        .from('rides')
        .select('*')
        .in('id', joinedRideIds) // 'id' IN array
        .order('created_at', { ascending: false });

        if (joinedError) {
            joinedError.statusCode = 400;
            throw joinedError;
        }

        joinedRides = joinedRidesData || [];
    }

    // combine both the owned array and joined array

    // using a set to avoid a dupliate, the case where owner is both owner + member
    const allRideIds = new Set();
    const allRides = [];

    // add all owned rides
    (ownedRides || []).forEach(ride => {
        if (!allRideIds.has(ride.id)) {
            allRideIds.add(ride.id);
            allRides.push({
                ...ride,
                user_role: 'owner' // mark as owner
            });
        }
    });

    // add joined rides (skip if already added as owner)
    joinedRides.forEach(ride => {
        if (!allRideIds.has(ride.id)) {
            allRideIds.add(ride.id);
            allRides.push({
                ...ride,
                user_role: 'member' // mark as member
            });
        } else {
            // if already exists as owner, update to show that they're also a member
            const existingRide = allRides.find(r => r.id === ride.id);
            if (existingRide) {
                existingRide.user_role = 'owner_and_member'; // edge case 
            }
        }
    });

    // enrich all rides with thier info
    const enrichedRides = await Promise.all(
        allRides.map(ride => enrichRide(ride))
    );

    return enrichedRides;
}



// helper function to grab the number of available seats per rideShare group
export async function getAvailableSeats(rideId) {
    const { count, error } = await supabase
        .from('ride_members')
        .select('*', { count: 'exact', head: true })
        .eq('ride_id', rideId)
        .eq('status', 'CONFIRMED JOINING');

    if (error) throw error;
    return count || 0;

}


// helper to update a ride (owner only)
export async function updateRideService(rideId, userId, updateData) {

    // check if ride exists AND get owner_id
    const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('id, owner_id')
        .eq('id', rideId)
        .single()

    if (rideError || !ride) {
        const error = new Error('Ride not found');
        error.statusCode = 404;
        throw error;
    }

    // auth check - is the user the owner ?
    if (ride.owner_id !== userId) {
        const error = new Error('Unauthorized: You can only update your own rides');
        error.statusCode = 403;
        throw error;
    }

    // build update object with only provided fields
    const updates = {};

    // the following conditionals serve to only add fields that are provided and not undefined/null

    if (updateData.origin_text !== undefined) {
        updates.origin_text = updateData.origin_text;
    }

    if (updateData.destination_text !== undefined) {
        updates.destination_text = updateData.destination_text;
    }

    if (updateData.depart_at !== undefined) {
        updates.depart_at = updateData.depart_at;
    }

    if (updateData.platform !== undefined) {
        updates.platform = updateData.platform;
    }
    if (updateData.max_seats !== undefined) {
        updates.max_seats = updateData.max_seats;
    }
    if (updateData.notes !== undefined) {
        updates.notes = updateData.notes;
    }

    // check if there's anything to update
    if (Object.keys(updates).length === 0) {
        const error = new Error('No fields provided to update');
        error.statusCode = 400;
        throw error;
    }

    // update the ride
    const { data: updatedRide, error: updateError } = await supabase
        .from('rides')
        .update(updates)
        .eq('id', rideId)
        .select('*')
        .single();
    
        if (updateError) {
            updateError.statusCode = 400;
            throw updateError;
        }

        return updatedRide;
    
}