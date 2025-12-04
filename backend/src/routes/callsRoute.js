import express from 'express';
import { joinCall, sendOffer, sendAnswer, sendIceCandidate, getCallStatus, leaveCall, getCallInfo } from '../controllers/callsController.js';


const router = express.Router();

// POST /api/calls/:rideId/join - join a call
router.post('/:rideId/join', authenticateUser, joinCall);

// POST /api/calls/:rideId/offer/:targetUserId - send WebRTC offer
router.post('/:rideId/offer/:targetUserId', authenticateUser, sendOffer);

// POST /api/calls/:rideId/answer/:targetUserId - send WebRTC answer
router.post('/:rideId/answer/:targetUserId', authenticateUser, sendAnswer);

// POST /api/calls/:rideId/ice-candidate/:targetUserId - send ICE candidate
router.post('/:rideId/ice-candidate/:targetUserId', authenticateUser, sendIceCandidate);

// GET /api/calls/:rideId/status - poll for signaling data
router.get('/:rideId/status', authenticateUser, getCallStatus);

// GET /api/calls/:rideId/info - get call information
router.get('/:rideId/info', authenticateUser, getCallInfo);

// DELETE /api/calls/:rideId/leave - leave a call
router.delete('/:rideId/leave', authenticateUser, leaveCall);



export default router;