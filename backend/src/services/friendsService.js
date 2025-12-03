import { supabase } from '../supabase.js';

export async function sendFriendRequestService(requesterId, addresseeId) {

    // prevent adding yourself as a friend
    if (requesterId === addresseeId) {
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

    if (userError || !addressee) {
        const error = new Error('User does not exist');
        error.statusCode = 400;
        throw error;
    }

    // check if friendship already exists
    const { data: existingFriendship, error: checkError } = await supabase
        .from('friendships')
        .select('id, status, requester_id, addressee_id')
        .or(`and(requester_id.eq.${requesterId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${requesterId})`)
        .maybeSingle();

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
            if (existingFriendship.requester_id === requesterId) {
                const error = new Error('Friend request already sent');
                error.statusCode = 400;
                throw error;
            } else {
                // other user already sent a request, so auto accept it
                const { error: updateError } = await supabase
                    .from('friendships')
                    .update({ status: 'ACCEPTED', updated_at: new Date().toISOString() })
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
        .from('friendships')
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
        const error = new Error('Friend request not found');
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
    let sentProfiles = [];
    if (sentUserIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, first_name, last_name, profile_photo_url')
            .in('id', sentUserIds);
        sentProfiles = profiles || [];
    }

    // get profiles for received requests
    const receivedUserIds = (receivedRequests || []).map(r => r.requester_id);
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
            user: sentProfiles.find(p => p.id === req.addressee_id) || null
        })),
        received: (receivedRequests || []).map((req, idx) => ({
            ...req,
            user: receivedProfiles.find(p => p.id === req.requester_id) || null
        }))
    };
}


// get friend count for a user 
export async function getFriendCountService(userId) {
    const { count, error } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACCEPTED')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (error) {
        error.statusCode = 500;
        throw error;
    }

    return count || 0;
}

// check if two users are friends
export async function areFriendsService(userId1, userId2) {
    const { data: friendship, error } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(requester_id.eq.${userId1},addressee_id.eq.${userId2}),and(requester_id.eq.${userId2},addressee_id.eq.${userId1})`)
        .eq('status', 'ACCEPTED')
        .maybeSingle();
    
    if (error) {
        error.statusCode = 500;
        throw error;
    }

    return !!friendship;
}


// get rides that a friend has joined and that are upcoming
export async function getFriendRidesService(userId, friendId) {
    // verify friendship
    const areFriends = await areFriendsService(userId, friendId);
    if (!areFriends) {
        const error = new Error('Not friends with this user');
        error.statusCode = 403;
        throw error;
    }

    // get rides where friend is a confirmed member
    const { data: memberRecords, error: memberError } = await supabase
        .from('ride_members')
        .select('ride_id')
        .eq('user_id', friendId)
        .eq('status', 'CONFIRMED JOINING');

    if (memberError) {
        memberError.statusCode = 500;
        throw memberError;
    }

    const rideIds = (memberRecords || []).map(r => r.ride_id);

    if (rideIds.length === 0) {
        return [];
    }

    // get rides that are upcoming (depart_at > now)
    const now = new Date();
    const { data: rides, error: ridesError } = await supabase
        .from('rides')
        .select('*')
        .in('id', rideIds)
        .gte('depart_at', now.toISOString())
        .order('depart_at', { ascending: true });
    
    if (ridesError) {
        ridesError.statusCode = 500;
        throw ridesError;
    }

    // enrich rides
    const { enrichRide } = await import('./rideService.js');
    const enrichedRides = await Promise.all(
        (rides || []).map(ride => enrichRide(ride, userId))
    );

    return enrichedRides;
}


// get upcomign rides from all friends (next few days)
export async function getFriendsUpcomingRidesService(userId, daysAhead = 7) {

    // get all friends
    const friends = await getFriendsService(userId);
    const friendIds = friends.map(f => f.id);

    if (friendIds.length === 0) {
        return [];
    }

    // get all rides where friends are confirmed members
    const { data: memberRecords, error: memberError } = await supabase
        .from('ride_members')
        .select('ride_id, user_id')
        .in('user_id', friendIds)
        .eq('status', 'CONFIRMED JOINING');

    if (memberError) {
        memberError.statusCode = 500;
        throw memberError;
    }

    const rideIds = [...new Set((memberRecords || []).map(r => r.ride_id))];

    if (rideIds.length === 0) {
        return [];
    }

    // get upcoming rides within the next N days
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data: rides, error: ridesError } = await supabase
        .from('rides')
        .select('*')
        .in('id', rideIds)
        .gte('depart_at', now.toISOString())
        .lte('depart_at', futureDate.toISOString())
        .order('depart_at', { ascending: true });

    if (ridesError) {
        ridesError.statusCode = 500;
        throw ridesError;
    }

    // enrich rides and attach friend info
    const { enrichRide } = await import('./rideService.js');
    const enrichedRides = await Promise.all(
        (rides || []).map(async (ride) => {
            const enriched = await enrichRide(ride, userId);
            // find which friends are in this ride
            const friendsInRide = memberRecords
                .filter(m => m.ride_id === ride.id)
                .map(m => {
                    const friend = friends.find(f => f.id === m.user_id);
                    return friend ? { id: friend.id, username: friend.username, first_name: friend.first_name, last_name: friend.last_name, profile_photo_url: friend.profile_photo_url } : null;
                })
                .filter(Boolean);
            
            return {
                ...enriched,
                friends_in_ride: friendsInRide
            };
        })
    );

    return enrichedRides;

}