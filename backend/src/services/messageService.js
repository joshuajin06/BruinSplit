import { supabase } from '../supabase.js';


// helper to ensure the user is a member of the ride
async function assertUserIsRideMember(rideId, userId) {
    const { data: member, error } = await supabase
        .from('ride_members')
        .select('id')
        .eq('ride_id', rideId)
        .eq('user_id', userId)
        .maybeSingle();

    // if the query itself fails, treat as server/database error
    if (error) {
        error.statusCode = 500;
        throw error;
    }
    
    // if no row, user is not a member of this ride
    if(!member) {
        const authError = new Error('You are not a member of this ride');
        authError.statusCode = 403;
        throw authError;
    }
}

// create a new message in a ride's chat
export async function createMessage(rideId, userId, content) {

    // auth - user must be a member of the given ride
    await assertUserIsRideMember(rideId, userId);

    // insert the message
    const { data: message, error } = await supabase
        .from('messages')
        .insert([
            {
                ride_id: rideId,
                user_id: userId,
                content
            }
        ])
        .select('*')
        .single();
    
    if (error) {
        error.statusCode = 400;
        throw error;
    }

    return message;

}

export async function getMessagesForRide(rideId, userId) {
    
    await assertUserIsRideMember(rideId, userId);

    // fetch messages from given ride
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('ride_id', rideId)
        .order('sent_at', { ascending: true });
    
    if (error) {
        error.statusCode = 400;
        throw error;
    }

    // return array of messages
    return messages || [];
}