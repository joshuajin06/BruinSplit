import { supabase } from '../supabase.js';

// helper function to initialize a ride
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