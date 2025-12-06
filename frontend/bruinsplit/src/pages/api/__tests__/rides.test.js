/**
 * @jest-environment jsdom
 */
import axios from 'axios';
import {
  getRides,
  createRide,
  joinRide,
  deleteRide,
  leaveRide,
  getMyRides,
  getRideById,
  updateRide,
  getMyPendingRides,
  getPendingRequests,
  manageRequest,
  kickMember,
  transferOwnership
} from '../rides';

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
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Rides API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('getRides', () => {
    it('should call GET /api/rides and return response', async () => {
      const mockRides = {
        data: {
          message: 'Rides retrieved successfully',
          rides: [{ id: '1', origin_text: 'UCLA', destination_text: 'LAX' }]
        }
      };
      axios.get.mockResolvedValue(mockRides);

      const result = await getRides();

      expect(axios.get).toHaveBeenCalledWith('http://localhost:8080/api/rides', { headers: {} });
      expect(result).toEqual(mockRides.data);
    });

    it('should handle errors when fetching rides', async () => {
      const error = new Error('Network error');
      axios.get.mockRejectedValue(error);

      await expect(getRides()).rejects.toThrow('Network error');
      expect(axios.get).toHaveBeenCalledWith('http://localhost:8080/api/rides', { headers: {} });
    });
  });

  describe('createRide', () => {
    it('should call POST /api/rides with ride data and return created ride', async () => {
      const rideData = {
        origin_text: 'UCLA',
        destination_text: 'LAX',
        depart_at: '2025-11-30T10:00:00Z',
        platform: 'UBER',
        max_seats: 4
      };
      const mockResponse = {
        data: {
          message: 'Ride created successfully',
          ride: { id: '123', ...rideData }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await createRide(rideData);

      expect(axios.post).toHaveBeenCalledWith('http://localhost:8080/api/rides', rideData, { headers: {} });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when creating ride', async () => {
      const error = new Error('Validation error');
      axios.post.mockRejectedValue(error);

      await expect(createRide({})).rejects.toThrow('Validation error');
    });
  });

  describe('joinRide', () => {
    it('should call POST /api/rides/:id/join with auth token', async () => {
      localStorageMock.setItem('token', 'fake-jwt-token');
      const rideId = 'ride-123';
      const mockResponse = {
        data: {
          message: 'Successfully joined ride',
          member: { user_id: 'user-1', ride_id: rideId }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await joinRide(rideId);

      expect(axios.post).toHaveBeenCalledWith(
        `http://localhost:8080/api/rides/${rideId}/join`,
        {},
        { headers: { Authorization: 'Bearer fake-jwt-token' } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle dual parameter format (userId, rideId)', async () => {
      localStorageMock.setItem('token', 'fake-jwt-token');
      const rideId = 'ride-456';
      const mockResponse = { data: { message: 'Successfully joined ride' } };
      axios.post.mockResolvedValue(mockResponse);

      await joinRide('user-123', rideId);

      expect(axios.post).toHaveBeenCalledWith(
        `http://localhost:8080/api/rides/${rideId}/join`,
        {},
        { headers: { Authorization: 'Bearer fake-jwt-token' } }
      );
    });

    it('should throw error if rideId is missing', async () => {
      await expect(joinRide()).rejects.toThrow('rideId is required');
    });

    it('should work without token (no Authorization header)', async () => {
      const rideId = 'ride-789';
      const mockResponse = { data: { message: 'Successfully joined ride' } };
      axios.post.mockResolvedValue(mockResponse);

      await joinRide(rideId);

      expect(axios.post).toHaveBeenCalledWith(
        `http://localhost:8080/api/rides/${rideId}/join`,
        {},
        { headers: {} }
      );
    });
  });

  describe('deleteRide', () => {
    it('should call DELETE /api/rides/:id with auth token', async () => {
      localStorageMock.setItem('token', 'fake-jwt-token');
      const rideId = 'ride-123';
      const mockResponse = { data: { message: 'Ride deleted successfully' } };
      axios.delete.mockResolvedValue(mockResponse);

      const result = await deleteRide(rideId);

      expect(axios.delete).toHaveBeenCalledWith(
        `http://localhost:8080/api/rides/${rideId}`,
        { headers: { Authorization: 'Bearer fake-jwt-token' } }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('leaveRide', () => {
    it('should call DELETE /api/rides/:id/leave with auth token', async () => {
      localStorageMock.setItem('token', 'fake-jwt-token');
      const rideId = 'ride-123';
      const mockResponse = { data: { message: 'Successfully left ride' } };
      axios.delete.mockResolvedValue(mockResponse);

      const result = await leaveRide(rideId);

      expect(axios.delete).toHaveBeenCalledWith(
        `http://localhost:8080/api/rides/${rideId}/leave`,
        { headers: { Authorization: 'Bearer fake-jwt-token' } }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getMyRides', () => {
    it('should call GET /api/rides/my-rides with auth token', async () => {
      localStorageMock.setItem('token', 'fake-jwt-token');
      const mockResponse = {
        data: {
          message: 'My rides retrieved successfully',
          rides: [{ id: '1' }, { id: '2' }]
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getMyRides();

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8080/api/rides/my-rides',
        { headers: { Authorization: 'Bearer fake-jwt-token' } }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getRideById', () => {
    it('should call GET /api/rides/:id without auth (public)', async () => {
      const rideId = 'ride-123';
      const mockResponse = {
        data: {
          message: 'Ride retrieved successfully',
          ride: { id: rideId, origin_text: 'UCLA', destination_text: 'LAX' }
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getRideById(rideId);

      expect(axios.get).toHaveBeenCalledWith(`http://localhost:8080/api/rides/${rideId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateRide', () => {
    it('should call PUT /api/rides/:id with auth token and update data', async () => {
      localStorageMock.setItem('token', 'fake-jwt-token');
      const rideId = 'ride-123';
      const updateData = { max_seats: 5, notes: 'Updated notes' };
      const mockResponse = {
        data: {
          message: 'Ride updated successfully',
          ride: { id: rideId, ...updateData }
        }
      };
      axios.put.mockResolvedValue(mockResponse);

      const result = await updateRide(rideId, updateData);

      expect(axios.put).toHaveBeenCalledWith(
        `http://localhost:8080/api/rides/${rideId}`,
        updateData,
        { headers: { Authorization: 'Bearer fake-jwt-token' } }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getMyPendingRides', () => {
    it('should call GET /api/rides/my-pending with auth token', async () => {
      localStorageMock.setItem('token', 'fake-jwt-token');
      const mockResponse = {
        data: {
          pending_rides: [
            { id: 'ride-1', origin_text: 'UCLA', status: 'pending' }
          ]
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getMyPendingRides();

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8080/api/rides/my-pending',
        { headers: { Authorization: 'Bearer fake-jwt-token' } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when fetching pending rides', async () => {
      localStorageMock.setItem('token', 'fake-jwt-token');
      const error = new Error('Unauthorized');
      error.response = { data: { error: 'Unauthorized' } };
      axios.get.mockRejectedValue(error);

      await expect(getMyPendingRides()).rejects.toThrow('Unauthorized');
    });
  });

  describe('getPendingRequests', () => {
    it('should call GET /api/rides/:id/pending with auth token', async () => {
      localStorageMock.setItem('token', 'fake-jwt-token');
      const rideId = 'ride-123';
      const mockResponse = {
        data: {
          pending_requests: [
            { user_id: 'user-1', username: 'john' },
            { user_id: 'user-2', username: 'jane' }
          ]
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getPendingRequests(rideId);

      expect(axios.get).toHaveBeenCalledWith(
        `http://localhost:8080/api/rides/${rideId}/pending`,
        { headers: { Authorization: 'Bearer fake-jwt-token' } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when fetching pending requests', async () => {
      localStorageMock.setItem('token', 'fake-jwt-token');
      const error = new Error('Ride not found');
      error.response = { data: { error: 'Ride not found' } };
      axios.get.mockRejectedValue(error);

      await expect(getPendingRequests('invalid-id')).rejects.toThrow('Ride not found');
    });
  });

  describe('manageRequest', () => {
    it('should POST to approve a join request', async () => {
      localStorageMock.setItem('token', 'fake-jwt-token');
      const rideId = 'ride-123';
      const memberId = 'user-456';
      const action = 'approve';
      const mockResponse = {
        data: { message: 'Request approved successfully' }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await manageRequest(rideId, memberId, action);

      expect(axios.post).toHaveBeenCalledWith(
        `http://localhost:8080/api/rides/${rideId}/${action}/${memberId}`,
        {},
        { headers: { Authorization: 'Bearer fake-jwt-token' } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should POST to reject a join request', async () => {
      localStorageMock.setItem('token', 'fake-jwt-token');
      const rideId = 'ride-123';
      const memberId = 'user-456';
      const action = 'reject';
      const mockResponse = {
        data: { message: 'Request rejected successfully' }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await manageRequest(rideId, memberId, action);

      expect(axios.post).toHaveBeenCalledWith(
        `http://localhost:8080/api/rides/${rideId}/${action}/${memberId}`,
        {},
        { headers: { Authorization: 'Bearer fake-jwt-token' } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when managing requests', async () => {
      localStorageMock.setItem('token', 'fake-jwt-token');
      const error = new Error('Invalid action');
      error.response = { data: { error: 'Invalid action' } };
      axios.post.mockRejectedValue(error);

      await expect(manageRequest('ride-123', 'user-456', 'invalid')).rejects.toThrow('Invalid action');
    });
  });

  describe('kickMember', () => {
    it('should DELETE to kick member from ride', async () => {
      localStorageMock.setItem('token', 'fake-jwt-token');
      const rideId = 'ride-123';
      const memberId = 'user-456';
      const mockResponse = {
        data: { message: 'Member kicked successfully' }
      };
      axios.delete.mockResolvedValue(mockResponse);

      const result = await kickMember(rideId, memberId);

      expect(axios.delete).toHaveBeenCalledWith(
        `http://localhost:8080/api/rides/${rideId}/kick/${memberId}`,
        { headers: { Authorization: 'Bearer fake-jwt-token' } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when kicking member', async () => {
      localStorageMock.setItem('token', 'fake-jwt-token');
      const error = new Error('Only owner can kick members');
      error.response = { data: { error: 'Only owner can kick members' } };
      axios.delete.mockRejectedValue(error);

      await expect(kickMember('ride-1', 'user-1')).rejects.toThrow('Only owner can kick members');
    });
  });

  describe('transferOwnership', () => {
    it('should POST to transfer ride ownership', async () => {
      localStorageMock.setItem('token', 'fake-jwt-token');
      const rideId = 'ride-123';
      const newOwnerId = 'user-456';
      const mockResponse = {
        data: {
          message: 'Ownership transferred successfully',
          ride: { id: rideId, owner_id: newOwnerId }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await transferOwnership(rideId, newOwnerId);

      expect(axios.post).toHaveBeenCalledWith(
        `http://localhost:8080/api/rides/${rideId}/transfer-ownership/${newOwnerId}`,
        {},
        { headers: { Authorization: 'Bearer fake-jwt-token' } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when transferring ownership', async () => {
      localStorageMock.setItem('token', 'fake-jwt-token');
      const error = new Error('User not a member');
      error.response = { data: { error: 'User not a member' } };
      axios.post.mockRejectedValue(error);

      await expect(transferOwnership('ride-123', 'user-456')).rejects.toThrow('User not a member');
    });
  });
});
