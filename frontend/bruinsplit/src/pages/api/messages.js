import axios from 'axios';

const backend_url = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

// backend url link with axios instance
const apiClient = axios.create({
   baseURL: backend_url
});

 // authentication token interceptor
apiClient.interceptors.request.use(config => {
   const token = localStorage.getItem('token');
   if (token) {
       config.headers.Authorization = `Bearer ${token}`;
   }
   return config;
});

// if there is an error, log it with endpoint info
apiClient.interceptors.response.use(
   response => response,
   error => {
       const endpoint = error.config?.url || 'unknown';
       console.error(`API Error [${endpoint}]:`, error.response?.data || error.message);
       return Promise.reject(error);
   }
);

// function to post a new message 
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