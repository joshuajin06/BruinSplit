import { supabase } from '../supabase.js';

export async function sendFriendRequestService(requesterId, addresseeId) {
    
    // prevent adding yourself as a friend
    if (requesterId === addresseId) {
        const error = new Error('Cannot send friend request to yourself');
        error.statusCode = 400;
        throw error;
    }

    // check if addresse exists 
    const { data: addressee, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', addresseeId)
        .single();

    if (checkError) {
        checkError.statusCode = 500;
        throw checkError;
    }

    if (existingFriendship) {

        if (existingFriendship.status === 'ACCEPTED') {
            const error = new Error('Already friends with this user');
            error.statusCode = 400;
            throw error;
        }

        if (existingFriendship.status === 'PENDING') {
            if (existingFriendship.requester.id === requesterId) {
                const error = new Error('Friend request already sent');
                error.statusCode = 400;
                throw error;
            } else {
                // other user already sent a request, so auto accept it
                const { error: updateError } = await supabase
                    .from('friendships')
                    .update({ status: 'ACCEPTED', updated_at: new Date().toISOString })
                    .eq('id', existingFriendship.id);

                if (updateError) {
                    updateError.statusCode = 500;
                    throw updateError;
                }

                return { message: 'Friend request accepted', status: 'ACCEPTED' };
            }
        }

        if (existingFriendship.status === 'REJECTED') {
            // update rejected request to pending
            const { error: updateError } = await supabase
                .from('friendships')
                .update({
                    status: 'PENDING',
                    requester_id: requesterId,
                    addressee_id: addresseeId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingFriendship.id);

            if (updateError) {
                updateError.statusCode = 500;
                throw updateError;
            }

            return { message: 'Friend request sent', status: 'PENDING' };
        }
    }


    
}