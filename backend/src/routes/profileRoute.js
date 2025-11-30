import express from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

// GET /api/profile/me
router.get('/me', authenticateUser, getProfile);

// PUT /api/profile/me
router.put('/me', authenticateUser, updateProfile);

export default router;

