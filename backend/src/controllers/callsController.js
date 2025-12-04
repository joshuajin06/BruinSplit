import { es } from 'zod/locales';
import { verifyRideMembership, getConfirmedMembers } from '../services/callService.js';


/** 
 WebRTC enables direct peer-to-peer connections, it:
 * uses a signaling server (our backend) to exchange connection info
 * has media flow through peers once connected
 
We will be going through three phases : 

(1) SDP (session description protocol) : has an offer/answer flow
    - sendOffer() stores x's offer so the y can fetch it
    - sendAnswer() stores y's answer so x can fetch it
    - getCallStatus() lets each peer poll for offers/answers 

(2) ICE candidates (Interactive Connectivity Establishment) : finds the best network path between peers and tries multiple connection methods (e.g. local IP, public IP, via STUN, relay via TURN)
    - sendIceCandidate() stores each candidate as it's discovered
    - getCallStatus() returns all pending candidates

(3) Connection Establishment : once both peers have both SDP and ICE, WebRTC will try to establish a direct connection-- once connected, media flows directly and our backend is no longer involved

*** our app will temporarily store offers/answers/ICE -> signal messages b/t peers -> verify permissions ***

*/



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


// POST /api/calls/:rideId/offer/:targetUserId 
// - create & send WebRTC offer from current user to target user
export async function sendOffer(req, res, next) {
    try {
        const { rideId, targetUserId } = req.params;
        const { offer } = req.body;
        const fromUserId = req.user.id;

        if (!offer) {
            return res.status(400).json({ error: 'Offer is required' });
        }

        // verify user is in the call
        const isTargetMember = await verifyRideMembership(rideId, targetUserId);
        if (!isTargetMember) {
            return res.status(403).json({
                error: 'Target user is not a confirmed member of this ride'
            });
        }

        // store offer in target user's peer connection state
        if (!call.peerConnections.has(targetUserId)) {
            call.peerConnections.set(targetUserId, {
                offers: new Map(),
                answers: new Map(),
                iceCandidates: new Map()
            });
        }

        const targetState = call.peerConnections.get(targetUserId);
        targetState.offers.set(fromUserId, {
            from: fromUserId,
            offer,
            timestamp: Date.now()
        });

        res.json({ success: true });

    } catch (error) {
        next(error);
    }
}


// POST /api/calls/:rideId/answer/:targetUserId - create and send WebRTC answer
export async function sendAnswer(req, res, next) {
    try {

    } catch (error) {
        next(error);
    }
}


// POST /api/calls/:rideId/ice-candidate/:targetUserId 
// - send ICE candidate (network discovery)
export async function sendIceCandidate(req, res, next) {
    try {

    } catch (error) {

    }
}


// GET /api/calls/:rideId/status - poll for signaling data (any new offers & ICE ?)
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



