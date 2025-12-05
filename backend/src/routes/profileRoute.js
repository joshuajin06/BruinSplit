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




/**
 * @openapi
 * /profile/me:
 *   get:
 *     tags: ['Profile']
 *     summary: Get current user's profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/profile/me
router.get('/me', authenticateUser, getProfile);


/**
 * @openapi
 * /profile/{userId}:
 *   get:
 *     tags: ['Profile']
 *     summary: Get a user's public profile
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Public profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/profile/:userId - get any user's public profile
router.get('/:userId', getProfileById);



/**
 * @openapi
 * /profile/me:
 *   put:
 *     tags: ['Profile']
 *     summary: Update current user's profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Profile'
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
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
// PUT /api/profile/me
router.put('/me', authenticateUser, updateProfile);



/**
 * @openapi
 * /profile/me/photo:
 *   post:
 *     tags: ['Profile']
 *     summary: Upload profile photo
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Photo uploaded
 *       400:
 *         description: File too large/invalid
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
// POST /api/profile/me/photo - upload profile photo
router.post('/me/photo', authenticateUser, upload.single('photo'), uploadProfilePhoto);



/**
 * @openapi
 * /profile/me/photo:
 *   delete:
 *     tags: ['Profile']
 *     summary: Delete profile photo
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Photo deleted
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE /api/profile/me/photo - delete profile photo
router.delete('/me/photo', authenticateUser, deleteProfilePhoto);



export default router;

