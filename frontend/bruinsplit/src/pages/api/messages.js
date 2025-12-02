import axios from 'axios';
const url = "http://localhost:8080/api";

// POST /api/messages
export const postMessage = async (rideId, content) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.post(`${url}/messages`, { ride_id: rideId, content }, { headers });
        return response.data;
    } catch (error) {
        console.error('Error posting message:', error.response?.data || error.message);
        throw error;
    }
    return null;
};

// GET /api/messages
export const getMessages = async (rideId) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${url}/messages`, { 
            headers,
            params: { ride_id: rideId }
        });
        return response.data;
    } catch (error) {
        console.error('Error getting messages:', error.response?.data || error.message);
        throw error;
    }
    return null;
};
