import axios from 'axios';

const url = "http://localhost:8080/api";

// Create configured axios instance
const apiClient = axios.create({
    baseURL: url
});

// Automatically add auth token to all requests
apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Centralized error handling (optional)
apiClient.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// Now your functions are much simpler
export const postMessage = async (rideId, content) => {
    const { data } = await apiClient.post('/messages', { 
        ride_id: rideId, 
        content 
    });
    return data;
};

export const getMessages = async (rideId) => {
    const { data } = await apiClient.get('/messages', {
        params: { ride_id: rideId }
    });
    return data;
};

export const getConversations = async () => {
    const { data } = await apiClient.get('/messages/conversations');
    return data;
};