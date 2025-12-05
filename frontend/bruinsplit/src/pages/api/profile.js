import axios from "axios";

const url = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

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

export const getProfileById = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${url}/profile/${userId}`, { headers });
    return response.data.profile;
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message;
    console.error('Error fetching profile:', errorMessage);
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

export const updateProfilePic = async(file) => {
  try {
    const formData = new FormData();
    formData.append('photo', file);

    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(`${url}/profile/me/photo`, formData, { headers });
    return response.data;
  } catch(err) {
      const errorMessage = err.response?.data?.error || err.message;
      console.error('Error updating profile pic:', errorMessage);
      const error = new Error(errorMessage);
      throw error;
  }
}