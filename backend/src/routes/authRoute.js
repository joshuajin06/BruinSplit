import express from 'express';
import { signup, login, retrieveUser, logout, changePassword } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticateUser, retrieveUser)
router.post('/logout', authenticateUser, logout)
router.put('/change-password', authenticateUser, changePassword)

export default router;

