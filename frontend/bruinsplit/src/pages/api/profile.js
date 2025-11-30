import axios from "axios";

const url = "http://localhost:8080/api";

export const updateProfile = async (userId, profileData) => {
    try {
        const response = await axios.put(`${url}/profile/${userId}`, profileData);  
        return response.data;
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
    return null;
};

