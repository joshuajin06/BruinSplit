import express from 'express';
import { postRide, joinRide, deleteRide, leaveRide, getRides, getRideById, getMyRides, updateRide, getPendingRequests, approveRequest, rejectRequest, kickMember, getMyPendingRides, transferOwnership } from '../controllers/ridesController.js';
import { authenticateUser, maybeAuthenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

/**
 * @openapi
 * /rides:
 *   post:
 *     tags: ['Rides']
 *     summary: Create a ride
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ride'
 *           example:
 *             title: "Finals Flight"
 *             origin: "Hedrick Court"
 *             destination: "LAX"
 *             datetime: "2025-12-13T14:00:00Z"
 *             seats: 4
 *             notes: "leaving from hedrick"
 *     responses:
 *       201:
 *         description: Ride created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ride'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/rides - allows user to create a rides post
router.post('/', authenticateUser, postRide); // in progress




/**
 * @openapi
 * /rides:
 *   get:
 *     tags: ['Rides']
 *     summary: List rides (public; membership info if authenticated)
 *     responses:
 *       200:
 *         description: List of rides
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ride'
 */
// GET /api/rides - get all rides (public, but optionally authenticated to include membership_status)
router.get('/', maybeAuthenticateUser, getRides);


/**
 * @openapi
 * /rides/my-rides:
 *   get:
 *     tags: ['Rides']
 *     summary: Get rides current user joined/owns
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: User rides
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
// GET /api/rides/my-rides - get all rides a user has joined
router.get('/my-rides', authenticateUser, getMyRides);



/**
 * @openapi
 * /rides/my-pending:
 *   get:
 *     tags: ['Rides']
 *     summary: Get rides where user has pending requests
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Pending rides
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
// GET /api/rides/my-pending - get all rides where user has a 'PENDING' request
router.get('/my-pending', authenticateUser, getMyPendingRides);



/**
 * @openapi
 * /rides/{id}/join:
 *   post:
 *     tags: ['Rides']
 *     summary: Request to join a ride
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Join requested
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Ride not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/rides/:id/join - add a user to the ride
router.post('/:id/join', authenticateUser, joinRide);




/**
 * @openapi
 * /rides/{id}/approve/{userId}:
 *   post:
 *     tags: ['Rides']
 *     summary: Approve pending rider (owner)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Approved
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/rides/:id/approve/:userId - approve request to join ride (owner only)
router.post('/:id/approve/:userId', authenticateUser, approveRequest);


/**
 * @openapi
 * /rides/{id}/reject/{userId}:
 *   post:
 *     tags: ['Rides']
 *     summary: Reject pending rider (owner)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Rejected
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/rides/:id/reject/:userId - reject request to join a ride (owner only)
router.post('/:id/reject/:userId', authenticateUser, rejectRequest);



/**
 * @openapi
 * /rides/{id}/transfer-ownership/{userId}:
 *   post:
 *     tags: ['Rides']
 *     summary: Transfer ride ownership to confirmed member
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ownership transferred
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/rides/:id/transfer-ownership/:userId - transfer ownership of a ride to a confirmed ride member
router.post('/:id/transfer-ownership/:userId', authenticateUser, transferOwnership);



/**
 * @openapi
 * /rides/{id}/pending:
 *   get:
 *     tags: ['Rides']
 *     summary: Get pending join requests (owner)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Pending requests
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/rides/:id/pending - get pending requests to join a ride (owner only)
router.get('/:id/pending', authenticateUser, getPendingRequests);



/**
 * @openapi
 * /rides/{id}/leave:
 *   delete:
 *     tags: ['Rides']
 *     summary: Leave a ride
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Left ride
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE /api/rides/:id/leave - leave a ride
router.delete('/:id/leave', authenticateUser, leaveRide);


/**
 * @openapi
 * /rides/{id}/kick/{userId}:
 *   delete:
 *     tags: ['Rides']
 *     summary: Kick a confirmed member (owner)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Member removed
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE /api/rides/:id/kick/:userId - kick a confirmed member of ride (owner only)
router.delete('/:id/kick/:userId', authenticateUser, kickMember);



/**
 * @openapi
 * /rides/{id}:
 *   delete:
 *     tags: ['Rides']
 *     summary: Delete a ride (owner)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ride deleted
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE /api/rides/:id - delete a ride
router.delete('/:id', authenticateUser, deleteRide);



/**
 * @openapi
 * /rides/{id}:
 *   get:
 *     tags: ['Rides']
 *     summary: Get ride by ID (public; owner info when authenticated)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ride details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ride'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/rides/:id - get specific ride by ID (public, we know if the user is the owner)
router.get('/:id', maybeAuthenticateUser, getRideById);


/**
 * @openapi
 * /rides/{id}:
 *   put:
 *     tags: ['Rides']
 *     summary: Update ride (owner)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ride'
 *     responses:
 *       200:
 *         description: Ride updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ride'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PUT /api/rides/:id - update a ride (owner only)
router.put('/:id', authenticateUser, updateRide);

export default router;