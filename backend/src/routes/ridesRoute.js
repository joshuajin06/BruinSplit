import express from 'express';
import { postRide, joinRide, deleteRide, leaveRide, getRides, getRideById, getMyRides, updateRide } from '../controllers/ridesController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

// POST /api/rides - allows user to create a rides post
router.post('/', authenticateUser, postRide); // in progress

// POST /api/rides/:id/join - Add a user to the ride
router.post('/:id/join', authenticateUser, joinRide);

// DELETE /api/rides/:id - Delete a ride
router.delete('/:id', authenticateUser, deleteRide);

// DELETE /api/rides/:id/leave - Leave a ride 
router.delete('/:id/leave', authenticateUser, leaveRide);

// GET /api/rides - Get all rides (public, no auth needed)
router.get('/', getRides);

// GET /api/rides/my-rides - Get all rides a user has joined
router.get('/my-rides', authenticateUser, getMyRides);

// GET /api/rides/:id - Get specific ride by ID (public)
router.get('/:id', getRideById);

// PUT /api/rides/:id - Update a ride (owner only)
router.put('/:id', authenticateUser, updateRide);

export default router;