import express from 'express';
import { postMessage, getMessages, getConversations } from '../controllers/messagesController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

// POST /api/messages
router.post('/', authenticateUser, postMessage);

// GET /api/messages/conversations - get all conversations for current user
router.get('/conversations', authenticateUser, getConversations);

// GET /api/messages - get messages for a specific ride
router.get('/', authenticateUser, getMessages);


export default router;