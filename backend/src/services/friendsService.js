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

// get all friends for a user
export async function getFriendsService(userId) {
    // get all accepted friendships where usr is either requester or addressee
    const { data: friendships, error } = await supabase
        .from('friendships')
        .select('id, requester_id, addressee_id, created_at')
        .eq('status', 'ACCEPTED')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (error) {
        error.statusCode = 500;
        throw error;
    }

    // extract friend IDs
    const friendIds = (friendships || []).map(f =>
        f.requester_id === userId ? f.addressee_id : f.requester_id
    );

    if (friendIds.length === 0) {
        return [];
    }

    // get friend profiles
    const { data: friends, error: friendsError } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, profile_photo_url')
        .in('id', friendIds);

    if (friendsError) {
        friendsError.statusCode = 500;
        throw friendsError;
    }

    return friends || [];
}


// get pending friend requests (sent and received)
export async function getPendingFriendRequestsService(userId) {

    // get requests user sent (pending)
    const { data: sentRequests, error: sentError } = await supabase
        .from('friendships')
        .select('id, addressee_id, created_at')
        .eq('requester_id', userId)
        .eq('status', 'PENDING');
    
    if (sentError) {
        sentError.statusCode = 500;
        throw sentError;
    }

    // get requests user received (pending)
    const { data: receivedRequests, error: receivedError } = await supabase
        .from('friendships')
        .select('id, requester_id, created_at')
        .eq('addressee_id', userId)
        .eq('status', 'PENDING');

    if (receivedError) {
        receivedError.statusCode = 500;
        throw receivedError;
    }

    // get profiles for sent requests
    const sentUserIds = (sentRequests || []).map(r => r.addressee_id);
    let receivedProfiles = [];
    if (receivedUserIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, first_name, last_name, profile_photo_url')
            .in('id', receivedUserIds);
        receivedProfiles = profiles || [];
    }

    return {
        sent: (sentRequests || []).map((req, idx) => ({
            ...req,
            user: sentProfiles[idx] || null
        })),
        received: (receivedRequests || []).map((req, idx) => ({
            ...req,
            user: receivedProfiles[idx] || null
        }))
    };
}

