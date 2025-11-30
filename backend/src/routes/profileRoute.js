import express from 'express';
import { getProfile, getProfileById, updateProfile } from '../controllers/profileController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

// GET /api/profile/me
router.get('/me', authenticateUser, getProfile);

// GET /api/profile/:userId - get any user's public profile
router.get('/:userId', getProfileById);

// PUT /api/profile/me
router.put('/me', authenticateUser, updateProfile);

export default router;

