import axios from 'axios';

const url = "http://localhost:8080/api";

// Created axios instance with url
const apiClient = axios.create({
    baseURL: url
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
    const { data } = await apiClient.post('/messages', { 
        ride_id: rideId, 
        content 
    });
    return data;
};

// GET /api/messages?ride_id=<rideId>
export const getMessages = async (rideId) => {
    const { data } = await apiClient.get('/messages', {
        params: { ride_id: rideId }
    });
    return data;
};

// GET /api/messages/conversations
export const getConversations = async () => {
    const { data } = await apiClient.get('/messages/conversations');
    return data;
};