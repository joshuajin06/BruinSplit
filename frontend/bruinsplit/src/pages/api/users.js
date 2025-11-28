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


