import { sendFriendRequestService, acceptFriendRequestService, rejectFriendRequestService, removeFriendService, getFriendsService, getPendingFriendRequestsService, getFriendCountService, getFriendRidesService, getFriendsUpcomingRidesService } from '../services/friendsService.js';


// POST /api/friends/request/:userId - send friend request
export async function sendFriendRequest(req, res, next) {
    try {
        const { userId: addresseeId } = req.params;
        const requesterId = req.user.id;

        if (!addresseeId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const result = await sendFriendRequestService(requesterId, addresseeId);

        return res.status(201).json({
            message: result.message,
            status: result.status || 'PENDING'
        });

    } catch (error) {
        console.error('Send friend request:', error);
        next(error);
    }
}


// POST /api/friends/accept/:userId - accept friend request
export async function acceptFriendRequest(req, res, next) {
    try {
        const { userId: requesterId } = req.params;
        const userId = req.user.id;

        if (!requesterId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const result = await acceptFriendRequestService(userId, requesterId);

        return res.status(200).json({
            message: result.message
        });
        
    } catch (error) {
        console.error('Accept friend request error:', error);
        next(error);
    }
}


// POST /api/friends/reject/:userId - reject friend request
export async function rejectFriendRequest(req, res, next) {
    try {
        const { userId: requesterId } = req.params;
        const userId = req.user.id;

        if (!requesterId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const result = await rejectFriendRequestService(userId, requesterId);

        return res.status(200).json({
            message: result.message
        });

    } catch (error) {
        console.error('Reject friend request error:', error);
        next(error);
    }
}


// DELETE /api/friends/:userId - remove/unfriend
export async function removeFriend(req, res, next) {
    try {

    } catch (error) {

    }
}



// GET /api/friends - get all friends
export async function getFriends(req, res, next) {
    try {

    } catch (error) {

    }
}


// GET /api/friends/pending - get pending requests
export async function getPendingRequests(req, res, next) {
    try {

    } catch (error) {

    }
}


// GET /api/friends/count/:userId - get friend count for a user (public)
export async function getFriendCount(req, res, next) {
    try {

    } catch (error) {
        
    }
}


// GET /api/friends/:userId/friends - get a user's friends list (public)
export async function getUserFriends(req, res, next) {
    try {

    } catch (error) {

    }
}


// GET /api/friends/:userId/rides - get rides a friend has joined
export async function getFriendRides(req, res, next) {
    try {

    } catch (error) {
        
    }
}


// GET /api/friends/rides/upcoming - get upcoming rides from all friends
export async function getFriendsUpcomingRides(req, res, next) {
    try {

    } catch (error) {

    }
}