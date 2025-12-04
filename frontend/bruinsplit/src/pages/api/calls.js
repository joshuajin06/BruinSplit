import axios from 'axios';
const url = "http://localhost:8080/api";

export const joinCall = async (rideId) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.post(`${url}/calls/${rideId}/join`, {}, {
            headers,
        });
        return response.data;
    } catch (error) {
        console.error('Error joining call:', error.response?.data || error.message);
        throw error;
    }
}

export const sendOffer = async (rideId, targetUserId, offer) => {
    try {
          const token = localStorage.getItem('token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const response = await axios.post(`${url}/calls/${rideId}/offer/${targetUserId}`, {
              offer
          }, {
              headers
          });
          return response.data;
      } catch (error) {
          console.error('Error sending offer:', error.response?.data || error.message);
          throw error;
      }
}

export const sendAnswer = async (rideId, targetUserId, answer) => {
    try {
          const token = localStorage.getItem('token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const response = await axios.post(`${url}/calls/${rideId}/answer/${targetUserId}`, {
              answer
          }, {
              headers
          });
          return response.data;
      } catch (error) {
          console.error('Error sending answer:', error.response?.data || error.message);
          throw error;
      }
}

export const sendIceCandidate = async (rideId, targetUserId, candidate) => {
    try {
          const token = localStorage.getItem('token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const response = await axios.post(`${url}/calls/${rideId}/ice-candidate/${targetUserId}`, {
              candidate
          }, {
              headers
          });
          return response.data;
      } catch (error) {
          console.error('Error sending ICE candidate:', error.response?.data || error.message);
          throw error;
      }
}


export const getCallStatus = async (rideId) => {
    try {
          const token = localStorage.getItem('token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const response = await axios.get(`${url}/calls/${rideId}/status`, {
              headers,
          });
          return response.data;
      } catch (error) {
          console.error('Error getting call status:', error.response?.data || error.message);
          throw error;
      }
}

export const getCallInfo = async (rideId) => {
    try {
          const token = localStorage.getItem('token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const response = await axios.get(`${url}/calls/${rideId}/info`, {
              headers,
          });
          return response.data;
      } catch (error) {
          console.error('Error getting call info:', error.response?.data || error.message);
          throw error;
      }
}

export const leaveCall = async (rideId) => {
    try {
          const token = localStorage.getItem('token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const response = await axios.delete(`${url}/calls/${rideId}/leave`, {
              headers,
          });
          return response.data;
      } catch (error) {
          console.error('Error leaving call:', error.response?.data || error.message);
          throw error;
      }
}

