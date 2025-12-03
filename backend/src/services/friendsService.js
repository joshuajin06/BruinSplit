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

    // create new friend request
    const { data: friendship, error: insertError } = await supabase
        .from('friendships')
        .insert([{
            requester_id: requesterId,
            addressee_id: addresseeId,
            status: 'PENDING'
        }])
        .select('*')
        .single();

    if (insertError) {
        insertError.statusCode = 500;
        throw insertError;
    }

    return { message: 'Friend request sent', friendship };
    
}

export async function acceptFriendRequestService(userId, requesterId) {

    // find the pending request
    const { data: friendship, error: findError } = await supabase
        .from('friendships')
        .select('id, status')
        .eq('requester_id', requesterId)
        .eq('addressee_id', userId)
        .eq('status', 'PENDING')
        .maybeSingle();

    if (findError) {
        findError.statusCode = 500;
        throw findError;
    }

    if (!friendship) {
        const error = new Error('Friend request not found');
        error.statusCode = 404;
        throw error;
    }

    // update status to ACCEPTED
    const { error: updateError } = await supabase
    .from('friendships')
    .update({ status: 'ACCEPTED', updated_at: new Date().toISOString() })
    .eq('id', friendship.id);

    if (updateError) {
        updateError.statusCode = 500;
        throw updateError;
    }

    return { message: 'Friend request accepted' };
}

// reject a friend request
export async function rejectFriendRequestService(userId, requesterId) {

    // find the pending request
    const { data: friendship, error: findError } = await supabase
        .from('friendshups')
        .select('id')
        .eq('requester_id', requesterId)
        .eq('addressee_id', userId)
        .eq('status', 'PENDING')
        .maybeSingle();

    if (findError) {
        findError.statusCode = 500;
        throw findError;
    }

    if (!friendship) {
        const error = new Error('Friend requester not found');
        error.statusCode = 404;
        throw error;
    }

    // update status to REJECTED
    const { error: updateError } = await supabase
        .from('friendships')
        .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
        .eq('id', friendship.id);

    if (updateError) {
        updateError.statusCode = 500;
        throw updateError;
    }

    return { message: 'Friend request rejected' };
    
}


// remove/unfriend a friend 
export async function removeFriendService(userId, friendId) {
    // find the friendship (can be the requester or accepter)
    const { data: friendship, error: findError } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(requester_id.eq.${userId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${userId})`)
        .eq('status', 'ACCEPTED')
        .maybeSingle();

    if (findError) {
        findError.statusCode = 500;
        throw findError;
    }

    if (!friendship) {
        const error = new Error('Friendship not found');
        error.statusCode = 404;
        throw error;
    }

    // delete the friendship
    const { error: deleteError } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendship.id);

    if (deleteError) {
        deleteError.statusCode = 500;
        throw deleteError;
    }

    return { message: 'Friend removed' };
}