import { verifyRideMembership, getConfirmedMembers } from '../services/callService.js';


// POST /api/calls/:rideId/join - join a call
export async function joinCall(req, res, next) {
    try {

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



