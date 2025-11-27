import express from 'express';
import { getRides, getRideById, postRide } from '../controllers/ridesController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

// POST /api/rides - allows user to create a rides post
router.post('/', authenticateUser, postRide); // in progress

// POST /api/rides/:id/join - Add a user to the ride
// TODO

// GET /api/rides - Get all rides (public, no auth needed)
router.get('/', getRides);

// GET /api/rides/:id - Get specific ride by ID (public)
router.get('/:id', getRideById);


// DELETE /api/rides/:id/leave - Leave a ride 
// TODO

// GET /api/rides/rides/my-rides - Get all rides a user has joined
// TODO

export default router;