import express from 'express';
import multer from 'multer';
import { getProfile, getProfileById, updateProfile, uploadProfilePhoto, deleteProfilePhoto } from '../controllers/profileController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

// configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// GET /api/profile/me
router.get('/me', authenticateUser, getProfile);

// GET /api/profile/:userId - get any user's public profile
router.get('/:userId', getProfileById);

// PUT /api/profile/me
router.put('/me', authenticateUser, updateProfile);

export default router;

