import express from 'express';
import { getRides, getRideById } from '../controllers/ridesController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

// GET /api/rides - Get all rides (public, no auth needed)
router.get('/', getRides);

// GET /api/rides/:id - Get specific ride by ID (public)
router.get('/:id', getRideById);

export default router;