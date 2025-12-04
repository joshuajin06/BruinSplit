import { supabase } from '../supabase.js';


export async function verifyRideMembership(rideId, userId) {
    // check if user is the owner of the ride
    const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('owner_id')
        .eq('id', rideId)
        .single();

    if (rideError || !ride) {
        const error = new Error('Ride not found');
        error.statusCode = 404;
        throw error;
    }

    // owner is always a confirmed member of the ride 
    if (ride.owner_id === userId) {
        return true;
    }

    // check if user is a confirmed member of the ride 
    const { data: membership, error: memberError } = await supabase
        .from('ride_members')
        .select('status')
        .eq('ride_id', rideId)
        .eq('user_id', userId)
        .eq('status', 'CONFIRMED JOINING')
        .maybeSingle();

    if (memberError) {
        memberError.statusCode = 500;
        throw memberError;
    }

    return !!membership;
}


export async function getConfirmedMembers(rideId) {
    // get ride owner
    const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('owner_id')
        .eq('id', rideId)
        .single();

    if(rideError || !ride) {
        const error = new Error('Ride not found');
        error.statusCode = 404;
        throw error;
    }

    // get all confirmed member
    const { data: members, error: membersError } = await supabase 
        .from('ride_members')
        .select('user_id')
        .eq('ride_id', rideId)
        .eq('status', 'CONFIRMED JOINING');
    
    if (membersError) {
        membersError.statusCode = 500;
        throw membersError;
    }

    // combine owner and confirmed members
    const memberIds = new Set([ride.owner_id]);
    if (members) {
        members.forEach(member => memberIds.add(member.user_id));
    }

    return Array.from(memberIds);
}