import axios from "axios";

const url = "http://localhost:8080/api";

export const updateProfile = async (profileData) => {
    try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.put(`${url}/profile/me`, profileData, { headers });  
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.error || error.message;
        console.error('Error updating password:', errorMessage);
        const err = new Error(errorMessage);
        throw err;
    }
};

export const updatePassword = async (passwordData) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.put(`${url}/auth/change-password`, passwordData, { headers });
    return response.data;
  } catch (err) {
    const errorMessage = err.response?.data?.error || err.message;
    console.error('Error updating password:', errorMessage);
    const error = new Error(errorMessage);
    throw error;
  }
};