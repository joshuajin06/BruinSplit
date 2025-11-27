import express from 'express';
import { signup, login } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup); // POST /api/auth/signup -> calls signup
router.post('/login', login); // POST /api/auth/login -> calls login

export default router;

