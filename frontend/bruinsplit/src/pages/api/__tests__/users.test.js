import axios from 'axios';
import { getUsers, createUser, getUserId } from '../users';

// Mock axios
jest.mock('axios');

describe('Users API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should call GET /api/users and return response', async () => {
      const mockUsers = {
        data: {
          users: [
            { id: '1', username: 'john_doe' },
            { id: '2', username: 'jane_doe' }
          ]
        }
      };
      axios.get.mockResolvedValue(mockUsers);

      const result = await getUsers();

      expect(axios.get).toHaveBeenCalledWith('http://localhost:8080/api/users');
      expect(result).toEqual(mockUsers);
    });

    it('should handle errors when fetching users', async () => {
      const error = new Error('Unauthorized');
      axios.get.mockRejectedValue(error);

      await expect(getUsers()).rejects.toThrow('Unauthorized');
      expect(axios.get).toHaveBeenCalledWith('http://localhost:8080/api/users');
    });
  });

  describe('createUser', () => {
    it('should call POST /api/auth/signup with user data and return response', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@ucla.edu',
        password: 'securepassword',
        first_name: 'New',
        last_name: 'User'
      };
      const mockResponse = {
        data: {
          message: 'User created successfully',
          token: 'jwt-token-here',
          user: { id: '123', username: 'newuser' }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await createUser(userData);

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8080/api/auth/signup',
        userData
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle validation errors when creating user', async () => {
      const userData = { username: 'test' }; // incomplete data
      const error = new Error('Missing required fields');
      axios.post.mockRejectedValue(error);

      await expect(createUser(userData)).rejects.toThrow('Missing required fields');
    });

    it('should handle duplicate username error', async () => {
      const userData = {
        username: 'existinguser',
        email: 'test@ucla.edu',
        password: 'password123'
      };
      const error = {
        response: {
          data: { error: 'Username already exists' },
          status: 409
        }
      };
      axios.post.mockRejectedValue(error);

      await expect(createUser(userData)).rejects.toEqual(error);
    });
  });

  describe('getUserId', () => {
    it('should call GET /api/users/username/:username and return user data', async () => {
      const username = 'john_doe';
      const mockResponse = {
        data: {
          id: 'user-123',
          username: 'john_doe',
          email: 'john@ucla.edu'
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getUserId(username);

      expect(axios.get).toHaveBeenCalledWith(
        `http://localhost:8080/api/users/username/${username}`
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle user not found error', async () => {
      const username = 'nonexistent';
      const error = {
        response: {
          data: { error: 'User not found' },
          status: 404
        }
      };
      axios.get.mockRejectedValue(error);

      await expect(getUserId(username)).rejects.toEqual(error);
    });

    it('should handle special characters in username', async () => {
      const username = 'user@test.com';
      const mockResponse = { data: { id: 'user-456' } };
      axios.get.mockResolvedValue(mockResponse);

      await getUserId(username);

      expect(axios.get).toHaveBeenCalledWith(
        `http://localhost:8080/api/users/username/${username}`
      );
    });
  });
});
