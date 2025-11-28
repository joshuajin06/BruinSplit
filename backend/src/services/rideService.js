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

    // query ride_members to see if the user is already in this ride 
    const { data: existingMember } = await supabase
        .from('ride_members')
        .select('id')
        .eq('ride_id', rideId)
        .eq('user_id', userId)
        .maybeSingle();

    // throw error if user is already in this ride
    if (existingMember) {
        const error = new Error('User already joined ride');
        error.statusCode = 400;
        throw error;
    }

    // insert new member into ride_members table
    const { data: member, error: insertError } = await supabase
        .from('ride_members')
        .insert([{
            ride_id: rideId,
            user_id: userId,
            status: 'CONFIRMED JOINING'
        }])
        .select('*')
        .single();

    if (insertError) {
        insertError.statusCode = 400;
        throw insertError;
    }

    return member;
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







// helper to enrich a ride with member count and owner info 
export async function enrichRide(ride) {
    const memberCount = await getAvailableSeats(ride.id);
    const availableSeats = ride.max_seats - memberCount;

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