import axios from 'axios';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
  getFriendCount,
  getUserFriends
} from '../friends';

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

describe('Friends API Tests', () => {
  const mockToken = 'mock-jwt-token';
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', mockToken);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('sendFriendRequest', () => {
    it('should POST friend request to specified user', async () => {
      const addresseeId = 'user-456';
      const mockResponse = {
        data: { message: 'Friend request sent', request_id: 'req-123' }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await sendFriendRequest(addresseeId);

      expect(axios.post).toHaveBeenCalledWith(
        `http://localhost:8080/api/friends/request/${addresseeId}`,
        {},
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when sending friend request fails', async () => {
      const error = new Error('User not found');
      error.response = { data: { error: 'User not found' } };
      axios.post.mockRejectedValue(error);

      await expect(sendFriendRequest('invalid-user')).rejects.toThrow('User not found');
    });

    it('should work without auth token', async () => {
      localStorage.clear();
      const mockResponse = { data: { message: 'Request sent' } };
      axios.post.mockResolvedValue(mockResponse);

      await sendFriendRequest('user-456');

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        {},
        { headers: {} }
      );
    });
  });

  describe('acceptFriendRequest', () => {
    it('should POST to accept friend request', async () => {
      const requesterId = 'user-789';
      const mockResponse = {
        data: { 
          message: 'Friend request accepted',
          friendship: { user1_id: mockUserId, user2_id: requesterId }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await acceptFriendRequest(requesterId);

      expect(axios.post).toHaveBeenCalledWith(
        `http://localhost:8080/api/friends/accept/${requesterId}`,
        {},
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when accepting friend request fails', async () => {
      const error = new Error('Request not found');
      error.response = { data: { error: 'Request not found' } };
      axios.post.mockRejectedValue(error);

      await expect(acceptFriendRequest('invalid-id')).rejects.toThrow('Request not found');
    });
  });

  describe('rejectFriendRequest', () => {
    it('should POST to reject friend request', async () => {
      const requesterId = 'user-789';
      const mockResponse = {
        data: { message: 'Friend request rejected' }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await rejectFriendRequest(requesterId);

      expect(axios.post).toHaveBeenCalledWith(
        `http://localhost:8080/api/friends/reject/${requesterId}`,
        {},
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when rejecting friend request fails', async () => {
      const error = new Error('Request not found');
      error.response = { data: { error: 'Request not found' } };
      axios.post.mockRejectedValue(error);

      await expect(rejectFriendRequest('invalid-id')).rejects.toThrow('Request not found');
    });
  });

  describe('removeFriend', () => {
    it('should DELETE to remove/unfriend user', async () => {
      const friendId = 'user-456';
      const mockResponse = {
        data: { message: 'Friend removed successfully' }
      };
      axios.delete.mockResolvedValue(mockResponse);

      const result = await removeFriend(friendId);

      expect(axios.delete).toHaveBeenCalledWith(
        `http://localhost:8080/api/friends/${friendId}`,
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when removing friend fails', async () => {
      const error = new Error('Friendship not found');
      error.response = { data: { error: 'Friendship not found' } };
      axios.delete.mockRejectedValue(error);

      await expect(removeFriend('invalid-id')).rejects.toThrow('Friendship not found');
    });
  });

  describe('getFriends', () => {
    it('should GET list of all friends', async () => {
      const mockResponse = {
        data: {
          friends: [
            { id: 'user-1', username: 'john', first_name: 'John' },
            { id: 'user-2', username: 'jane', first_name: 'Jane' }
          ]
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getFriends();

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8080/api/friends',
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should return empty friends list', async () => {
      const mockResponse = { data: { friends: [] } };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getFriends();

      expect(result.friends).toHaveLength(0);
    });

    it('should handle errors when getting friends fails', async () => {
      const error = new Error('Unauthorized');
      error.response = { data: { error: 'Unauthorized' } };
      axios.get.mockRejectedValue(error);

      await expect(getFriends()).rejects.toThrow('Unauthorized');
    });
  });

  describe('getPendingRequests', () => {
    it('should GET pending friend requests (sent and received)', async () => {
      const mockResponse = {
        data: {
          sent: [{ id: 'user-1', username: 'john' }],
          received: [{ id: 'user-2', username: 'jane' }]
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getPendingRequests();

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8080/api/friends/pending',
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toEqual(mockResponse.data);
      expect(result.sent).toHaveLength(1);
      expect(result.received).toHaveLength(1);
    });

    it('should handle no pending requests', async () => {
      const mockResponse = {
        data: { sent: [], received: [] }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getPendingRequests();

      expect(result.sent).toHaveLength(0);
      expect(result.received).toHaveLength(0);
    });

    it('should handle errors when getting pending requests fails', async () => {
      const error = new Error('Failed to fetch requests');
      error.response = { data: { error: 'Failed to fetch requests' } };
      axios.get.mockRejectedValue(error);

      await expect(getPendingRequests()).rejects.toThrow('Failed to fetch requests');
    });
  });

  describe('getFriendCount', () => {
    it('should GET friend count for a user (public endpoint)', async () => {
      const mockResponse = {
        data: { friend_count: 42 }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getFriendCount(mockUserId);

      expect(axios.get).toHaveBeenCalledWith(
        `http://localhost:8080/api/friends/count/${mockUserId}`
      );
      expect(result).toEqual(mockResponse.data);
      expect(result.friend_count).toBe(42);
    });

    it('should handle zero friend count', async () => {
      const mockResponse = { data: { friend_count: 0 } };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getFriendCount(mockUserId);

      expect(result.friend_count).toBe(0);
    });

    it('should handle errors when getting friend count fails', async () => {
      const error = new Error('User not found');
      error.response = { data: { error: 'User not found' } };
      axios.get.mockRejectedValue(error);

      await expect(getFriendCount('invalid-user')).rejects.toThrow('User not found');
    });
  });

  describe('getUserFriends', () => {
    it('should GET a specific user\'s friends list (public endpoint)', async () => {
      const mockResponse = {
        data: {
          friends: [
            { id: 'user-1', username: 'alice' },
            { id: 'user-2', username: 'bob' }
          ]
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getUserFriends(mockUserId);

      expect(axios.get).toHaveBeenCalledWith(
        `http://localhost:8080/api/friends/${mockUserId}/friends`
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle empty friends list', async () => {
      const mockResponse = { data: { friends: [] } };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getUserFriends(mockUserId);

      expect(result.friends).toHaveLength(0);
    });

    it('should handle errors when getting user friends fails', async () => {
      const error = new Error('User not found');
      error.response = { data: { error: 'User not found' } };
      axios.get.mockRejectedValue(error);

      await expect(getUserFriends('invalid-user')).rejects.toThrow('User not found');
    });
  });
});
