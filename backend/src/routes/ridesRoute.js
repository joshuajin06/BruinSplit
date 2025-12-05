import express from 'express';
import { postRide, joinRide, deleteRide, leaveRide, getRides, getRideById, getMyRides, updateRide, getPendingRequests, approveRequest, rejectRequest, kickMember, getMyPendingRides, transferOwnership } from '../controllers/ridesController.js';
import { authenticateUser, maybeAuthenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

// POST /api/rides - allows user to create a rides post
router.post('/', authenticateUser, postRide); // in progress

// GET /api/rides - get all rides (public, but optionally authenticated to include membership_status)
router.get('/', maybeAuthenticateUser, getRides);

// GET /api/rides/my-rides - get all rides a user has joined
// MUST come before /:id routes to avoid being matched as an :id parameter
router.get('/my-rides', authenticateUser, getMyRides);

// GET /api/rides/my-pending - get all rides where user has a 'PENDING' request
// MUST come before /:id routes to avoid being matched as an :id parameter
router.get('/my-pending', authenticateUser, getMyPendingRides);

// POST /api/rides/:id/join - add a user to the ride
router.post('/:id/join', authenticateUser, joinRide);

// POST /api/rides/:id/approve/:userId - approve request to join ride (owner only)
router.post('/:id/approve/:userId', authenticateUser, approveRequest);

// POST /api/rides/:id/reject/:userId - reject request to join a ride (owner only)
router.post('/:id/reject/:userId', authenticateUser, rejectRequest);

// POST /api/rides/:id/transfer-ownership/:userId - transfer ownership of a ride to a confirmed ride member
router.post('/:id/transfer-ownership/:userId', authenticateUser, transferOwnership);

// GET /api/rides/:id/pending - get pending requests to join a ride (owner only)
router.get('/:id/pending', authenticateUser, getPendingRequests);

// DELETE /api/rides/:id/leave - leave a ride
router.delete('/:id/leave', authenticateUser, leaveRide);

// DELETE /api/rides/:id/kick/:userId - kick a confirmed member of ride (owner only)
router.delete('/:id/kick/:userId', authenticateUser, kickMember);

// DELETE /api/rides/:id - delete a ride
router.delete('/:id', authenticateUser, deleteRide);

// GET /api/rides/:id - get specific ride by ID (public, we know if the user is the owner)
// MUST come after all other /:id/* routes
router.get('/:id', maybeAuthenticateUser, getRideById);

// PUT /api/rides/:id - update a ride (owner only)
router.put('/:id', authenticateUser, updateRide);

export default router;