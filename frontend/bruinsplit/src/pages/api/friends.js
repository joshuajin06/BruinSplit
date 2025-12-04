import axios from 'axios';
const url = "http://localhost:8080/api";

// POST /api/friends/request/:userId - send friend request
export const sendFriendRequest = async (addresseeId) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.post(`${url}/friends/request/${addresseeId}`, {}, { headers });
        return response.data;
    } catch (error) {
        console.error('Error sending friend request:', error.response?.data || error.message);
        throw error;
    }
};

// POST /api/friends/accept/:userId - accept friend request
export const acceptFriendRequest = async (requesterId) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.post(`${url}/friends/accept/${requesterId}`, {}, { headers });
        return response.data;
    } catch (error) {
        console.error('Error accepting friend request:', error.response?.data || error.message);
        throw error;
    }
};

// POST /api/friends/reject/:userId - reject friend request
export const rejectFriendRequest = async (requesterId) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.post(`${url}/friends/reject/${requesterId}`, {}, { headers });
        return response.data;
    } catch (error) {
        console.error('Error rejecting friend request:', error.response?.data || error.message);
        throw error;
    }
};

// DELETE /api/friends/:userId - remove/unfriend
export const removeFriend = async (friendId) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.delete(`${url}/friends/${friendId}`, { headers });
        return response.data;
    } catch (error) {
        console.error('Error removing friend:', error.response?.data || error.message);
        throw error;
    }
};

// GET /api/friends - get all friends
export const getFriends = async () => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.get(`${url}/friends`, { headers });
        return response.data;
    } catch (error) {
        console.error('Error getting friends:', error.response?.data || error.message);
        throw error;
    }
};

// GET /api/friends/pending - get pending requests
export const getPendingRequests = async () => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.get(`${url}/friends/pending`, { headers });
        return response.data;
    } catch (error) {
        console.error('Error getting pending requests:', error.response?.data || error.message);
        throw error;
    }
};

// GET /api/friends/count/:userId - get friend count for a user (public)
export const getFriendCount = async (userId) => {
    try {
        const response = await axios.get(`${url}/friends/count/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error getting friend count:', error.response?.data || error.message);
        throw error;
    }
};

// GET /api/friends/:userId/friends - get a user's friends list (public)
export const getUserFriends = async (userId) => {
    try {
        const response = await axios.get(`${url}/friends/${userId}/friends`);
        return response.data;
    } catch (error) {
        console.error('Error getting user friends:', error.response?.data || error.message);
        throw error;
    }
};

// GET /api/friends/:userId/rides - get rides a friend has joined
export const getFriendRides = async (friendId) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.get(`${url}/friends/${friendId}/rides`, { headers });
        return response.data;
    } catch (error) {
        console.error('Error getting friend rides:', error.response?.data || error.message);
        throw error;
    }
};

// GET /api/friends/rides/upcoming - get upcoming rides from all friends
export const getFriendsUpcomingRides = async (daysAhead = 7) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.get(`${url}/friends/rides/upcoming?days=${daysAhead}`, { headers });
        return response.data;
    } catch (error) {
        console.error('Error getting friends upcoming rides:', error.response?.data || error.message);
        throw error;
    }
};

