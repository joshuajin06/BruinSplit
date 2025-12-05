import express from 'express';
import { joinCall, sendOffer, sendAnswer, sendIceCandidate, getCallStatus, leaveCall, getCallInfo } from '../controllers/callsController.js';
import { authenticateUser } from '../middleware/authenticateUser.js'; 


const router = express.Router();

/**
 * @openapi
 * /calls/{rideId}/join:
 *   post:
 *     tags: ['Calls']
 *     summary: Join a call for a ride
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Joined call
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
// POST /api/calls/:rideId/join - join a call
router.post('/:rideId/join', authenticateUser, joinCall);


/**
 * @openapi
 * /calls/{rideId}/offer/{targetUserId}:
 *   post:
 *     tags: ['Calls']
 *     summary: Send WebRTC offer
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sdp: { type: string }
 *     responses:
 *       200:
 *         description: Offer sent
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/calls/:rideId/offer/:targetUserId - send WebRTC offer
router.post('/:rideId/offer/:targetUserId', authenticateUser, sendOffer);


/**
 * @openapi
 * /calls/{rideId}/answer/{targetUserId}:
 *   post:
 *     tags: ['Calls']
 *     summary: Send WebRTC answer
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sdp: { type: string }
 *     responses:
 *       200:
 *         description: Answer sent
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/calls/:rideId/answer/:targetUserId - send WebRTC answer
router.post('/:rideId/answer/:targetUserId', authenticateUser, sendAnswer);


/**
 * @openapi
 * /calls/{rideId}/ice-candidate/{targetUserId}:
 *   post:
 *     tags: ['Calls']
 *     summary: Send ICE candidate
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               candidate: { type: string }
 *     responses:
 *       200:
 *         description: Candidate sent
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/calls/:rideId/ice-candidate/:targetUserId - send ICE candidate
router.post('/:rideId/ice-candidate/:targetUserId', authenticateUser, sendIceCandidate);


/**
 * @openapi
 * /calls/{rideId}/status:
 *   get:
 *     tags: ['Calls']
 *     summary: Poll for signaling data
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Signaling data
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/calls/:rideId/status - poll for signaling data
router.get('/:rideId/status', authenticateUser, getCallStatus);


/**
 * @openapi
 * /calls/{rideId}/info:
 *   get:
 *     tags: ['Calls']
 *     summary: Get call info
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Call info
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/calls/:rideId/info - get call information
router.get('/:rideId/info', authenticateUser, getCallInfo);

/**
 * @openapi
 * /calls/{rideId}/leave:
 *   delete:
 *     tags: ['Calls']
 *     summary: Leave a call
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Left call
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE /api/calls/:rideId/leave - leave a call
router.delete('/:rideId/leave', authenticateUser, leaveCall);



export default router;