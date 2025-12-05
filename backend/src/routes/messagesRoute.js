import express from 'express';
import { postMessage, getMessages, getConversations } from '../controllers/messagesController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

/**
 * @openapi
 * /messages:
 *   post:
 *     tags: ['Messages']
 *     summary: Post a message to a ride conversation
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rideId, content]
 *             properties:
 *               rideId: { type: string }
 *               content: { type: string }
 *     responses:
 *       201:
 *         description: Message sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/messages
router.post('/', authenticateUser, postMessage);



/**
 * @openapi
 * /messages/conversations:
 *   get:
 *     tags: ['Messages']
 *     summary: List user conversations
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Conversations
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/messages/conversations - get all conversations for current user
router.get('/conversations', authenticateUser, getConversations);



/**
 * @openapi
 * /messages:
 *   get:
 *     tags: ['Messages']
 *     summary: Get messages for a ride
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: rideId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Ride not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/messages - get messages for a specific ride
router.get('/', authenticateUser, getMessages);


export default router;