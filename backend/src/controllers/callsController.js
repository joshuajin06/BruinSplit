import { verifyRideMembership, getConfirmedMembers } from '../services/callsService.js';


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

*** NOTE backend does NOT handle media streams, P2P will do this via WebRTC via frontend ***

*/



const activeCalls = new Map();


// POST /api/calls/:rideId/join - join a call for a ride
export async function joinCall(req, res, next) {
    try {
        const { rideId } = req.params;
        const userId = req.user.id;

        console.log(`\n[JOIN] User ${userId} joining call for rideId ${rideId}`);
        console.log(`[JOIN] Calls in memory: ${activeCalls.size}`);

        // verify user is a confirmed member
        const isMember = await verifyRideMembership(rideId, userId);
        if (!isMember) {
            console.log(`[JOIN] ❌ User ${userId} is NOT a member of ride ${rideId}`);
            return res.status(403).json({
                error: 'You must be a confirmed member of this ride to join the call'
            });
        }

        console.log(`[JOIN] ✅ User verified as member`);

        // get all confirmed members
        const allMembers = await getConfirmedMembers(rideId);
        console.log(`[JOIN] Confirmed members: ${allMembers.join(', ')}`);

        // initialize or update call state
        const callExists = activeCalls.has(rideId);
        if (!callExists) {
            console.log(`[JOIN] Creating NEW call for ride ${rideId}`);
            activeCalls.set(rideId, {
                participants: new Set(),
                peerConnections: new Map(),
                createdAt: new Date().toISOString()
            });
        } else {
            console.log(`[JOIN] Call already exists for ride ${rideId}`);
        }

        const call = activeCalls.get(rideId);
        const beforeSize = call.participants.size;
        call.participants.add(userId);
        const afterSize = call.participants.size;

        console.log(`[JOIN] Participants: ${beforeSize} → ${afterSize}`);
        console.log(`[JOIN] All participants: ${Array.from(call.participants).join(', ')}`);

        // initialize peer connection state for this user if it doesn't exist
        if (!call.peerConnections.has(userId)) {
            console.log(`[JOIN] Creating peer connection state for ${userId}`);
            call.peerConnections.set(userId, {
                offers: new Map(),
                answers: new Map(),
                iceCandidates: new Map()
            });
        }

        const response = {
            success: true,
            callId: rideId,
            participants: Array.from(call.participants),
            allMembers: allMembers
        };

        console.log(`[JOIN] Response: ${response.participants.length} participants\n`);

        res.json(response);

    } catch (error) {
        console.error(`[JOIN] ❌ Error:`, error.message);
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

        const call = activeCalls.get(rideId);
        if (!call || !call.participants.has(fromUserId)) {
            return res.status(404).json({
                error: 'Call not found or user not in call'
            });
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
        const { rideId, targetUserId } = req.params;
        const { answer } = req.body;
        const fromUserId = req.user.id;

        if (!answer) {
            return res.status(400).json({ error: 'Answer is required' });
        }

        // get the call state
        const call = activeCalls.get(rideId);
        if (!call || !call.participants.has(fromUserId)) {
            return res.status(404).json({
                error: 'Call not found or user not in call'
            });
        }

        // verify the target user is a confirmed member of the ride
        const isTargetMember = await verifyRideMembership(rideId, targetUserId);
        if (!isTargetMember) {
            return res.status(403).json({
                error: 'Target user is not a confirmed member of this ride'
            });
        }

        // store answer in target's user peer connection state
        if (!call.peerConnections.has(targetUserId)) {
            call.peerConnections.set(targetUserId, {
                offers: new Map(),
                answers: new Map(),
                iceCandidates: new Map()
            });
        }

        const targetState = call.peerConnections.get(targetUserId);
        targetState.answers.set(fromUserId, {
            from: fromUserId,
            answer,
            timestamp: Date.now()
        });

        res.json({ success: true });

    } catch (error) {
        next(error);
    }
}


// POST /api/calls/:rideId/ice-candidate/:targetUserId 
// - send ICE candidate (network discovery)
export async function sendIceCandidate(req, res, next) {
    try {
        const { rideId, targetUserId } = req.params;
        const { candidate } = req.body;
        const fromUserId = req.user.id;

        if (!candidate) {
            return res.status(400).json({ error: 'ICE candidate is required' });
        }

        // get the call state
        const call = activeCalls.get(rideId);
        if (!call || !call.participants.has(fromUserId)) {
            return res.status(404).json({
                error: 'Call not found or user not in call'
            })
        }

        // verify target user is a confirmed member
        const isTargetMember = await verifyRideMembership(rideId, targetUserId);
        if (!isTargetMember) {
            return res.status(403).json({
                error: 'Target user is not a confirmed member of this ride'
            });
        }

        // store ICE candidate in target user's peer connection state
        if (!call.peerConnections.has(targetUserId)) {
            call.peerConnections.set(targetUserId, {
                offers: new Map(),
                answers: new Map(),
                iceCandidates: new Map()
            });
        }

        const targetState = call.peerConnections.get(targetUserId);
        if (!targetState.iceCandidates.has(fromUserId)) {
            targetState.iceCandidates.set(fromUserId, []);
        }

        targetState.iceCandidates.get(fromUserId).push({
            from: fromUserId,
            candidate,
            timestamp: Date.now()
        });

        res.json({ success: true });

    } catch (error) {
        next(error);
    }
}


// GET /api/calls/:rideId/status - poll for signaling data (any new offers & ICE ?)
export async function getCallStatus(req, res, next) {
    try {
        const { rideId } = req.params;
        const userId = req.user.id;

        const call = activeCalls.get(rideId);
        if (!call || !call.participants.has(userId)) {
            return res.json({ active: false });
        }

        const userState = call.peerConnections.get(userId) || {
            offers: new Map(),
            answers: new Map(),
            iceCandidates: new Map()
        };

        // convert Maps to plain objects for JSON response
        const offers = {};
        userState.offers.forEach((value, key) => {
            offers[key] = value;
        });

        const answers = {};
        userState.answers.forEach((value, key) => {
            answers[key] = value;
        });

        const iceCandidates = {};
        userState.iceCandidates.forEach((candidates, key) => {
            iceCandidates[key] = candidates;
        });

        // clear processed signaling data after sending (frontend will process this)
        userState.offers.clear();
        userState.answers.clear();
        userState.iceCandidates.clear();

        res.json({
            active: true,
            participants: Array.from(call.participants),
            offers,
            answers,
            iceCandidates
        });


    } catch (error) {
        next(error);
    }
}




// GET /api/calls/:rideId/info - get call information 
export async function getCallInfo(req, res, next) {
    try {

        const { rideId } = req.params;
        const userId = req.user.id;

        // verify user is a confirmed member
        const isMember = await verifyRideMembership(rideId, userId);
        if (!isMember) {
            return res.status(403).json({
                error: 'You must be a confirmed member of this ride to view call info'
            });
        }

        const call = activeCalls.get(rideId);
        if (!call) {
            return res.json({
                active: false,
                participants: []
            });
        }

        // get all confirmed members
        const allMembers = await getConfirmedMembers(rideId);

        res.json({
            active: true,
            participants: Array.from(call.participants),
            allMembers: allMembers,
            createdAt: call.createdAt
        });

    } catch (error) {
        next(error);
    }
}


// DELETE /api/calls/:rideId/leave - leave a call
export async function leaveCall(req, res, next) {
    try {

        const { rideId } = req.params;
        const userId = req.user.id;

        const call = activeCalls.get(rideId);
        if (call) {
            // remove user from participants
            call.participants.delete(userId);

            // remove user's peer connection state
            call.peerConnections.delete(userId);

            // clean up references to this user in other peer connections
            call.peerConnections.forEach((state, targetUserId) => {
                state.offers.delete(userId);
                state.answers.delete(userId);
                state.iceCandidates.delete(userId);
            });

            // if no participants left, remove call entirely
            if (call.participants.size === 0) {
                activeCalls.delete(rideId);
            }
        }

        res.json({ success: true });

    } catch (error) {
        next(error);
    }
}



