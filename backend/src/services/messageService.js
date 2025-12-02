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

// get all conversations for a user (rides they're a member of)
export async function getConversationsForUser(userId) {
    // get all rides where user is a member (CONFIRMED JOINING)
    const { data: memberRecords, error: memberError } = await supabase
        .from('ride_members')
        .select('ride_id')
        .eq('user_id', userId)
        .eq('status', 'CONFIRMED JOINING');

    if (memberError) {
        memberError.statusCode = 400;
        throw memberError;
    }

    const rideIds = (memberRecords || []).map(record => record.ride_id);

    if (rideIds.length === 0) {
        return [];
    }

    // fetch ride details with owner and member info
    const { data: rides, error: ridesError } = await supabase
        .from('rides')
        .select(`
            id,
            origin_text,
            destination_text,
            depart_at,
            owner_id,
            created_at,
            owner:profiles!rides_owner_id_fkey(
                id,
                username,
                first_name,
                last_name
            )
        `)
        .in('id', rideIds)
        .order('created_at', { ascending: false });

    if (ridesError) {
        ridesError.statusCode = 400;
        throw ridesError;
    }

    // for each ride, get the last message and the other users
    const conversations = await Promise.all(
        (rides || []).map(async (ride) => {
            // get the last message
            const { data: lastMessage } = await supabase
                .from('messages')
                .select('id, content, user_id, sent_at')
                .eq('ride_id', ride.id)
                .order('sent_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            // get other members in the ride
            const { data: members } = await supabase
                .from('ride_members')
                .select(`
                    user_id,
                    profile:profiles!ride_members_user_id_fkey(
                        id,
                        username,
                        first_name,
                        last_name
                    )
                `)
                .eq('ride_id', ride.id)
                .eq('status', 'CONFIRMED JOINING')
                .neq('user_id', userId);

            const otherUsers = (members || []).map(m => m.profile);

            return {
                id: ride.id,
                ride_id: ride.id,
                origin: ride.origin_text,
                destination: ride.destination_text,
                depart_at: ride.depart_at,
                owner_id: ride.owner_id,
                owner: ride.owner,
                other_users: otherUsers,
                preview: lastMessage?.content || 'No messages yet',
                last_message_sent_at: lastMessage?.sent_at,
                created_at: ride.created_at
            };
        })
    );

    return conversations;
}