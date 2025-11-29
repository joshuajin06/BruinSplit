import express from 'express';
import { postMessage, getMessages } from '../controllers/messagesController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

// POST /api/messages
router.post('/', authenticateUser, postMessage);

// GET /api/messages
router.get('/', authenticateUser, getMessages);


export default router;