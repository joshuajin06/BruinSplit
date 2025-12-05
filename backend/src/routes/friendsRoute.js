import express from 'express';
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, getFriends, getPendingRequests, getFriendCount, getUserFriends, getFriendRides, getFriendsUpcomingRides } from '../controllers/friendsController.js';
import { authenticateUser, maybeAuthenticateUser } from '../middleware/authenticateUser.js';


const router = express.Router();


/**
 * @openapi
 * /friends/request/{userId}:
 *   post:
 *     tags: ['Friends']
 *     summary: Send friend request
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Request sent
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/friends/request/:userId - send friend request to a user
router.post('/request/:userId', authenticateUser, sendFriendRequest);



/**
 * @openapi
 * /friends/accept/{userId}:
 *   post:
 *     tags: ['Friends']
 *     summary: Accept friend request
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Accepted
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/friends/accept/:userId - accept friend request from a user
router.post('/accept/:userId', authenticateUser, acceptFriendRequest);



/**
 * @openapi
 * /friends/reject/{userId}:
 *   post:
 *     tags: ['Friends']
 *     summary: Reject friend request
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Rejected
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/friends/reject/:userId - reject friend request from a user 
router.post('/reject/:userId', authenticateUser, rejectFriendRequest);


/**
 * @openapi
 * /friends/{userId}:
 *   delete:
 *     tags: ['Friends']
 *     summary: Remove friend
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Removed
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE /api/friends/:userId - remove/unfriend a user as a friend
router.delete('/:userId', authenticateUser, removeFriend);



/**
 * @openapi
 * /friends:
 *   get:
 *     tags: ['Friends']
 *     summary: List current user's friends
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Friends list
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/friends - get all friends 
router.get('/', authenticateUser, getFriends);



/**
 * @openapi
 * /friends/pending:
 *   get:
 *     tags: ['Friends']
 *     summary: Get pending friend requests
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Pending requests
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/friends/pending - get pending friend requests
router.get('/pending', authenticateUser, getPendingRequests);


/**
 * @openapi
 * /friends/rides/upcoming:
 *   get:
 *     tags: ['Friends']
 *     summary: Get upcoming rides from all friends
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Upcoming rides
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ride'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/friends/rides/upcoming - get upcoming rides from all friends
router.get('/rides/upcoming', authenticateUser, getFriendsUpcomingRides);


/**
 * @openapi
 * /friends/count/{userId}:
 *   get:
 *     tags: ['Friends']
 *     summary: Get friend count (public)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Count
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/friends/count/:userId - get friend count (public)
router.get('/count/:userId', getFriendCount);




/**
 * @openapi
 * /friends/{userId}/friends:
 *   get:
 *     tags: ['Friends']
 *     summary: Get a user's friends (public)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Friends list
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/friends/:userId/friends - get a user's friends list (public)
router.get('/:userId/friends', getUserFriends);



/**
 * @openapi
 * /friends/{userId}/rides:
 *   get:
 *     tags: ['Friends']
 *     summary: Get rides a friend has joined
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Friend rides
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ride'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/friends/:userId/rides - get rides a friend has joined
router.get('/:userId/rides', authenticateUser, getFriendRides);



export default router;