import axios from 'axios';

const backend_url = "http://localhost:8080/api";

// Created axios instance with url
const apiClient = axios.create({
    baseURL: backend_url
});

// add auth header if token exists
apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// if there exists an error, log it
apiClient.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// POST /api/messages
export const postMessage = async (rideId, content) => {
    try {
        const { data } = await apiClient.post('/messages', { 
            ride_id: rideId, 
            content 
        });
        return data;
    } catch (error) {
        console.error('Error posting message:', error.response?.data || error.message);
        throw error;
    }
};

// GET /api/messages?ride_id=<rideId>
export const getMessages = async (rideId) => {
    try {
        const { data } = await apiClient.get('/messages', {
            params: { ride_id: rideId }
        });
        return data;
    } catch (error) {
        console.error('Error getting messages:', error.response?.data || error.message);
        throw error;
    }
};

// GET /api/messages/conversations
export const getConversations = async () => {
    try {
        const { data } = await apiClient.get('/messages/conversations');
        return data;
    } catch (error) {
        console.error('Error getting conversations:', error.response?.data || error.message);
        throw error;
    }
};