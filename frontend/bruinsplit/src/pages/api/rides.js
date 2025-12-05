import axios from "axios";
const url = "http://localhost:8080/api";

export const getRides = async () => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${url}/rides`, { headers });
        return response.data;
    } catch (error) {
        console.error("Error fetching rides:", error);
        throw error;
    }
    return null;
};

// GET /api/rides/my-pending
export const getMyPendingRides = async () => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.get(`${url}/rides/my-pending`, { headers });
    return res.data;
  } catch (err) {
    console.error('Error fetching pending rides:', err.response?.data || err.message);
    throw err;
  }
};

export const getPendingRequests = async (rideId) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.get(`${url}/rides/${rideId}/pending`, { headers });
    return res.data;
  } catch (err) {
    console.error('Error fetching pending requests:', err.response?.data || err.message);
    throw err;
  }
}

export const createRide = async (rideData) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.post(`${url}/rides`, rideData, { headers });
        return response.data;
    } catch (error) {
        console.error("Error creating ride:", error);
        throw error;
    }
    return null;
};

export const joinRide = async (userId, rideId) => {
    try {
    // The server determines the user from the Bearer token.
    // Accept either (userId, rideId) where first arg may be rideId,
    // or a single rideId as the first param. Resolve the final rideId.
    const rideIdFinal = rideId || userId;
    if (!rideIdFinal) throw new Error('rideId is required');

    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await axios.post(`${url}/rides/${rideIdFinal}/join`, {}, { headers });
    return response.data;
    } catch (error) {
        console.error('Error joining ride:', error.response?.data || error.message);
        throw error;
    }
};

// DELETE /api/rides/:id
export const deleteRide = async (rideId) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.delete(`${url}/rides/${rideId}`, { headers });
    return res.data;
  } catch (err) {
    console.error('Error deleting ride:', err.response?.data || err.message);
    throw err;
  }
};

// DELETE /api/rides/:id/leave
export const leaveRide = async (rideId) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.delete(`${url}/rides/${rideId}/leave`, { headers });
    return res.data;
  } catch (err) {
    console.error('Error leaving ride:', err.response?.data || err.message);
    throw err;
  }
};


// GET /api/rides/my-rides
export const getMyRides = async () => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.get(`${url}/rides/my-rides`, { headers });
    return res.data;
  } catch (err) {
    console.error('Error fetching my rides:', err.response?.data || err.message);
    throw err;
  }
};

// GET /api/rides/:id
export const getRideById = async (rideId) => {
  try {
    const res = await axios.get(`${url}/rides/${rideId}`);
    return res.data;
  } catch (err) {
    console.error('Error fetching ride:', err.response?.data || err.message);
    throw err;
  }
};

// PUT /api/rides/:id
export const updateRide = async (rideId, updateData) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.put(`${url}/rides/${rideId}`, updateData, { headers });
    return res.data;
  } catch (err) {
    console.error('Error updating ride:', err.response?.data || err.message);
    throw err;
  }
};

//////////

// POST /api/rides/:id/:action/:memberId
export const manageRequest = async (rideId, memberId, action) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        // action should be 'approve' or 'reject'
        const res = await axios.post(`${url}/rides/${rideId}/${action}/${memberId}`, {}, { headers });
        return res.data;
    } catch (err) {
        console.error(`Error processing request (${action}):`, err.response?.data || err.message);
        throw err;
    }
};

// DELETE /api/rides/:id/kick/:memberId
export const kickMember = async (rideId, memberId) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.delete(`${url}/rides/${rideId}/kick/${memberId}`, { headers });
        return res.data;
    } catch (err) {
        console.error('Error kicking member:', err.response?.data || err.message);
        throw err;
    }
};

// POST /api/rides/:id/transfer-ownership/:newOwnerId
export const transferOwnership = async (rideId, newOwnerId) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.post(`${url}/rides/${rideId}/transfer-ownership/${newOwnerId}`, {}, { headers });
        return res.data;
    } catch (err) {
        console.error('Error transferring ownership:', err.response?.data || err.message);
        throw err;
    }
};