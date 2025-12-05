import axios from 'axios';
import {
  getProfile,
  updateProfile,
  getProfileById,
  updatePassword,
  updateProfilePic
} from '../profile';

// Mock axios
jest.mock('axios');

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key) => { delete store[key]; }
  };
})();
global.localStorage = localStorageMock;

describe('Profile API Tests', () => {
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', mockToken);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getProfile', () => {
    it('should GET current user profile', async () => {
      const mockResponse = {
        data: {
          profile: {
            id: 'user-123',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com'
          }
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getProfile();

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8080/api/profile/me',
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when getting profile fails', async () => {
      const errorMessage = 'Unauthorized';
      axios.get.mockRejectedValue({
        response: { data: { error: errorMessage } },
        message: errorMessage
      });

      await expect(getProfile()).rejects.toThrow(errorMessage);
    });
  });

  describe('updateProfile', () => {
    it('should PUT to update profile with data', async () => {
      const profileData = {
        first_name: 'John',
        last_name: 'Doe',
        bio: 'Student at UCLA'
      };
      const mockResponse = {
        data: {
          message: 'Profile updated successfully',
          profile: { id: 'user-123', ...profileData }
        }
      };
      axios.put.mockResolvedValue(mockResponse);

      const result = await updateProfile(profileData);

      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:8080/api/profile/me',
        profileData,
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle partial profile updates', async () => {
      const profileData = { bio: 'Updated bio only' };
      const mockResponse = {
        data: {
          message: 'Profile updated successfully',
          profile: { id: 'user-456', bio: 'Updated bio only' }
        }
      };
      axios.put.mockResolvedValue(mockResponse);

      const result = await updateProfile(profileData);

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when updating profile', async () => {
      const profileData = { first_name: 'Jane' };
      const errorMessage = 'Validation error';
      axios.put.mockRejectedValue({
        response: { data: { error: errorMessage } },
        message: errorMessage
      });

      await expect(updateProfile(profileData)).rejects.toThrow(errorMessage);
    });
  });

  describe('getProfileById', () => {
    it('should GET profile for specific user by ID', async () => {
      const userId = 'user-456';
      const mockResponse = {
        data: {
          profile: {
            id: userId,
            first_name: 'Jane',
            last_name: 'Smith',
            username: 'janesmith'
          }
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getProfileById(userId);

      expect(axios.get).toHaveBeenCalledWith(
        `http://localhost:8080/api/profile/${userId}`,
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toEqual(mockResponse.data.profile);
    });

    it('should handle user not found', async () => {
      const errorMessage = 'User not found';
      axios.get.mockRejectedValue({
        response: { data: { error: errorMessage } },
        message: errorMessage
      });

      await expect(getProfileById('invalid-id')).rejects.toThrow(errorMessage);
    });
  });

  describe('updatePassword', () => {
    it('should PUT to update user password', async () => {
      const passwordData = {
        currentPassword: 'oldpass123',
        newPassword: 'newpass456',
        confirmNewPassword: 'newpass456'
      };
      const mockResponse = {
        data: { message: 'Password updated successfully' }
      };
      axios.put.mockResolvedValue(mockResponse);

      const result = await updatePassword(passwordData);

      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:8080/api/auth/change-password',
        passwordData,
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpass',
        newPassword: 'newpass456',
        confirmNewPassword: 'newpass456'
      };
      const errorMessage = 'Current password is incorrect';
      axios.put.mockRejectedValue({
        response: { data: { error: errorMessage } },
        message: errorMessage
      });

      await expect(updatePassword(passwordData)).rejects.toThrow(errorMessage);
    });

    it('should handle password validation errors', async () => {
      const passwordData = {
        currentPassword: 'oldpass',
        newPassword: '123',
        confirmNewPassword: '123'
      };
      const errorMessage = 'Password too short';
      axios.put.mockRejectedValue({
        response: { data: { error: errorMessage } },
        message: errorMessage
      });

      await expect(updatePassword(passwordData)).rejects.toThrow(errorMessage);
    });
  });

  describe('updateProfilePic', () => {
    it('should POST to update profile picture with FormData', async () => {
      const mockFile = new File(['photo'], 'profile.jpg', { type: 'image/jpeg' });
      const mockResponse = {
        data: {
          message: 'Profile picture updated',
          profile: {
            id: 'user-123',
            profile_photo_url: 'https://example.com/photo.jpg'
          }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await updateProfilePic(mockFile);

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8080/api/profile/me/photo',
        expect.any(FormData),
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle file size errors', async () => {
      const mockFile = new File(['large photo'], 'profile.jpg', { type: 'image/jpeg' });
      const errorMessage = 'File size too large';
      axios.post.mockRejectedValue({
        response: { data: { error: errorMessage } },
        message: errorMessage
      });

      await expect(updateProfilePic(mockFile)).rejects.toThrow(errorMessage);
    });

    it('should handle invalid file type errors', async () => {
      const mockFile = new File(['file'], 'document.pdf', { type: 'application/pdf' });
      const errorMessage = 'Invalid file type';
      axios.post.mockRejectedValue({
        response: { data: { error: errorMessage } },
        message: errorMessage
      });

      await expect(updateProfilePic(mockFile)).rejects.toThrow(errorMessage);
    });
  });
});
