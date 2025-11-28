import axios from 'axios';

const url = 'http://localhost:8080/api'

export const getUsers = async () => {
    try {
        const response = await axios.get(`${url}/users`);
        return response 
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
    return null;
};


export const createUser = async (userData) => {
    try {
        const response = await axios.post(`${url}/auth/signup`, userData);
        return response.data;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

export const getUserId = async (username) => {
    try {
        const response = await axios.get(`${url}/users/username/${username}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user ID:', error);
        throw error;
    }
    return null;
};