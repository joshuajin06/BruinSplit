import express from 'express';
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, getFriends, getPendingRequests, getFriendCount, getUserFriends, getFriendRides, getFriendsUpcomingRides } from '../controllers/friendsController.js';
import { authenticateUser, maybeAuthenticateUser } from '../middleware/authenticateUser.js';


const router = express.Router();

// POST /api/friends/request/:userId - send friend request to a user
router.post('/request/:userId', authenticateUser, sendFriendRequest);

// POST /api/friends/accept/:userId - accept friend request from a user
router.post('/accept/:userId', authenticateUser, acceptFriendRequest);

// POST /api/friends/reject/:userId - reject friend request from a user 
router.post('/reject/:userId', authenticateUser, rejectFriendRequest);

// DELETE /api/friends/:userId - remove/unfriend a user as a friend
router.delete('/:userId', authenticateUser, removeFriend);

// GET /api/friends - get all friends 
router.get('/', authenticateUser, getFriends);

// GET /api/friends/pending - get pending friend requests
router.get('/pending', authenticateUser, getPendingRequests);

// GET /api/friends/count/:userId - get friend count (public)
router.get('/count/:userId', getFriendCount);

// GET /api/friends/:userId/friends - get a user's friends list (public)
router.get('/:userId/friends', getUserFriends);

// GET /api/friends/:userId/rides - get rides a friend has joined
router.get('/:userId/rides', authenticateUser, getFriendRides);

// GET /api/friends/rides/upcoming - get upcoming rides from all friends
router.get('/rides/upcoming', authenticateUser, getFriendsUpcomingRides);


export default router;