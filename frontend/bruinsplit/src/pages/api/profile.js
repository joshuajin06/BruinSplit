import axios from "axios";

const url = "http://localhost:8080/api";

export const updateProfile = async (profileData) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.put(`${url}/profile/me`, profileData, { headers });  
        return response.data;
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
};

export const updatePassword = async (userId, passwordData) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.put(`${url}/auth/change-password`, passwordData, { headers });
    return response.data;
  } catch (err) {
    console.error('Error updating password:', err.response?.data || err.message);
    throw err;
  }
};