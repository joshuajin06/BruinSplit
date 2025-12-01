import express from 'express';
<<<<<<< HEAD
import { postRide, joinRide, leaveRide, getRides, getRideById, deleteRide, getMyRides, updateRide } from '../controllers/ridesController.js';
import { authenticateUser, maybeAuthenticateUser } from '../middleware/authenticateUser.js';
=======
import { postRide, joinRide, deleteRide, leaveRide, getRides, getRideById, getMyRides, updateRide, getPendingRequests, approveRequest, rejectRequest, kickMember } from '../controllers/ridesController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
>>>>>>> e8dd26a73626a9daae5ba8dedadbcc7f50ad8503

const router = express.Router();

// POST /api/rides - allows user to create a rides post
router.post('/', authenticateUser, postRide); // in progress

// POST /api/rides/:id/join - add a user to the ride
router.post('/:id/join', authenticateUser, joinRide);

// POST /api/rides/:id/approve/:userId - approve request to join ride (owner only)
router.post('/:id/approve/:userId', authenticateUser, approveRequest);

// POST /api/rides/:id/reject/:userId - reject request to join a ride (owner only)
router.post('/:id/reject/:userId', authenticateUser, rejectRequest);

// DELETE /api/rides/:id - delete a ride
router.delete('/:id', authenticateUser, deleteRide);

// DELETE /api/rides/:id/leave - leave a ride 
router.delete('/:id/leave', authenticateUser, leaveRide);

<<<<<<< HEAD
// GET /api/rides - Get all rides (public). Use maybeAuthenticateUser so callers
// that send a valid Authorization header receive per-ride `is_member` flags.
router.get('/', maybeAuthenticateUser, getRides);
=======
// DELETE /api/rides/:id/kick/:userId - kick a confirmed member of ride (owner only)
router.delete('/:id/kick/:userId', authenticateUser, kickMember);

// GET /api/rides - get all rides (public, no auth needed)
router.get('/', getRides);
>>>>>>> e8dd26a73626a9daae5ba8dedadbcc7f50ad8503

// GET /api/rides/my-rides - get all rides a user has joined
router.get('/my-rides', authenticateUser, getMyRides);

// GET /api/rides/:id/pending - get pending requests to join a ride (owner only)
router.get('/:id/pending', authenticateUser, getPendingRequests);

// GET /api/rides/:id - get specific ride by ID (public)
router.get('/:id', getRideById);

// PUT /api/rides/:id - update a ride (owner only)
router.put('/:id', authenticateUser, updateRide);

export default router;