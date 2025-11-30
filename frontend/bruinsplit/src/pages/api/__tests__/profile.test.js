import axios from 'axios';
import { updateProfile } from '../profile';

// Mock axios
jest.mock('axios');

describe('Profile API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should call PUT /api/profile/:userId with profile data and return updated profile', async () => {
      const userId = 'user-123';
      const profileData = {
        first_name: 'John',
        last_name: 'Doe',
        bio: 'Student at UCLA',
        phone: '555-1234'
      };
      const mockResponse = {
        data: {
          message: 'Profile updated successfully',
          profile: { id: userId, ...profileData }
        }
      };
      axios.put.mockResolvedValue(mockResponse);

      const result = await updateProfile(userId, profileData);

      expect(axios.put).toHaveBeenCalledWith(
        `http://localhost:8080/api/profile/${userId}`,
        profileData
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle partial profile updates', async () => {
      const userId = 'user-456';
      const profileData = { bio: 'Updated bio only' };
      const mockResponse = {
        data: {
          message: 'Profile updated successfully',
          profile: { id: userId, bio: 'Updated bio only' }
        }
      };
      axios.put.mockResolvedValue(mockResponse);

      const result = await updateProfile(userId, profileData);

      expect(axios.put).toHaveBeenCalledWith(
        `http://localhost:8080/api/profile/${userId}`,
        profileData
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when updating profile', async () => {
      const userId = 'user-789';
      const profileData = { first_name: 'Jane' };
      const error = new Error('Unauthorized');
      axios.put.mockRejectedValue(error);

      await expect(updateProfile(userId, profileData)).rejects.toThrow('Unauthorized');
      expect(axios.put).toHaveBeenCalledWith(
        `http://localhost:8080/api/profile/${userId}`,
        profileData
      );
    });

    it('should handle validation errors', async () => {
      const userId = 'user-999';
      const profileData = { phone: 'invalid-phone-format' };
      const error = {
        response: {
          data: { error: 'Invalid phone number format' },
          status: 400
        }
      };
      axios.put.mockRejectedValue(error);

      await expect(updateProfile(userId, profileData)).rejects.toEqual(error);
    });

    it('should handle user not found', async () => {
      const userId = 'nonexistent';
      const profileData = { first_name: 'Test' };
      const error = {
        response: {
          data: { error: 'User not found' },
          status: 404
        }
      };
      axios.put.mockRejectedValue(error);

      await expect(updateProfile(userId, profileData)).rejects.toEqual(error);
    });
  });
});
