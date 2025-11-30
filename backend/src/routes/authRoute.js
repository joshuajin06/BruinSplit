import express from 'express';
import { supabase } from '../supabase.js';
import { signup, login, retrieveUser, logout, changePassword } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { comparePassword, hashPassword } from '../utils/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticateUser, retrieveUser)
router.post('/logout', authenticateUser, logout)
router.post('/change-password', authenticateUser, changePassword)

export default router;

