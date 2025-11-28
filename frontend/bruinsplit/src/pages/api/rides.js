import axios from "axios";
import { tr } from "zod/locales";
const url = "http://localhost:8080/api";

export const getRides = async () => {
    try {
        const response = await axios.get(`${url}/rides`);
        return response;
    } catch (error) {
        console.error("Error fetching rides:", error);
        throw error;
    }
    return null;
};

export const createRide = async (rideData) => {
    try {
        const response = await axios.post(`${url}/rides`, rideData);
        return response.data;
    } catch (error) {
        console.error("Error creating ride:", error);
        throw error;
    }
    return null;
};

export const joinRide = async (userId, rideId) => {
    try {
        

    } catch (error) {

    }
};
