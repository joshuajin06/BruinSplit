import { es } from 'zod/locales';
import { verifyRideMembership, getConfirmedMembers } from '../services/callService.js';

const activeCalls = new Map();


// POST /api/calls/:rideId/join - join a call for a ride
export async function joinCall(req, res, next) {
    try {
        const { rideId } = req.params;
        const userId = req.user.id;

        // verify user is a confirmed member
        const isMember = await verifyRideMembership(rideId, userId);
        if (!isMember) {
            return res.status(403).json({
                error: 'You must be a confirmed member of this ride to join the call'
            });
        }

        // get all confirmed members
        const allMembers = await getConfirmedMembers(rideId);

        // initialize or update call state
        if (!activeCalls.has(rideId)) {
            activeCalls.set(rideId, {
                participants: new Set(),
                peerConnections: new Map(),
                createdAt: new Date().toISOString()
            });
        }

        const call = activeCalls.get(rideId);
        call.participants.add(userId);

        // initialize peer connection state for this user if it doesn't exist
        if (!call.peerConnections.has(userId)) {
            call.peerConnections.set(userId, {
                offers: new Map(),
                answers: new Map(),
                iceCandidates: new Map()
            });
        }

        res.json({
            success: true,
            callId: rideId,
            participants: Array.from(call.participants),
            allMembers: allMembers
        });

    } catch (error) {
        next(error);
    }
}


// POST /api/calls/:rideId/offer/:targetUserId - send WebRTC offer
export async function sendOffer(req, res, next) {
    try {

    } catch (error) {
        next(error);
    }
}


// POST /api/calls/:rideId/answer/:targetUserId - send WebRTC answer
export async function sendAnswer(req, res, next) {
    try {

    } catch (error) {
        next(error);
    }
}


// POST /api/calls/:rideId/ice-candidate/:targetUserId - send ICE candidate
export async function sendIceCandidate(req, res, next) {
    try {

    } catch (error) {

    }
}


// GET /api/calls/:rideId/status - poll for signaling data
export async function getCallStatus(req, res, next) {
    try {

    } catch (error) {

    }
}




// GET /api/calls/:rideId/info - get call information
export async function getCallInfo(req, res, next) {
    try {

    } catch (error) {

    }
}


// DELETE /api/calls/:rideId/leave - leave a call
export async function leaveCall(req, res, next) {
    try {

    } catch (error) {

    }
}



