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
}


