import express from 'express';
import { getRides, getRideById, joinRide, postRide, leaveRide, deleteRide } from '../controllers/ridesController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

// GET /api/rides - Get all rides (public, no auth needed)
router.get('/', getRides);

// GET /api/rides/:id - Get specific ride by ID (public)
router.get('/:id', getRideById);

// POST /api/rides/:id/join - join a ride (authenticated)
router.post('/:id/join', authenticateUser, joinRide);

// POST /api/rides - create ride (authenticated)
router.post('/', authenticateUser, postRide);

// DELETE /api/rides/:id/leave - leave ride (authenticated)
router.delete('/:id/leave', authenticateUser, leaveRide);

// DELETE /api/rides/:id - delete ride (authenticated, owner only)
router.delete('/:id', authenticateUser, deleteRide);


export default router;