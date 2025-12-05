import axios from 'axios';
import {
  joinCall,
  sendOffer,
  sendAnswer,
  sendIceCandidate,
  getCallStatus,
  getCallInfo,
  leaveCall
} from '../calls';

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

describe('Calls API Tests', () => {
  const mockToken = 'mock-jwt-token';
  const mockRideId = 'ride-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', mockToken);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('joinCall', () => {
    it('should POST to /calls/:rideId/join with auth token', async () => {
      const mockResponse = {
        data: {
          message: 'Joined call successfully',
          call: { ride_id: mockRideId, participants: [] }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await joinCall(mockRideId);

      expect(axios.post).toHaveBeenCalledWith(
        `http://localhost:8080/api/calls/${mockRideId}/join`,
        {},
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when joining call fails', async () => {
      const error = new Error('Failed to join call');
      error.response = { data: { error: 'Failed to join call' } };
      axios.post.mockRejectedValue(error);

      await expect(joinCall(mockRideId)).rejects.toThrow('Failed to join call');
    });

    it('should work without auth token', async () => {
      localStorage.clear();
      const mockResponse = { data: { message: 'Joined call' } };
      axios.post.mockResolvedValue(mockResponse);

      await joinCall(mockRideId);

      expect(axios.post).toHaveBeenCalledWith(
        `http://localhost:8080/api/calls/${mockRideId}/join`,
        {},
        { headers: {} }
      );
    });
  });

  describe('sendOffer', () => {
    it('should POST offer to target user', async () => {
      const mockOffer = { type: 'offer', sdp: 'mock-sdp' };
      const mockResponse = {
        data: { message: 'Offer sent successfully' }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await sendOffer(mockRideId, mockUserId, mockOffer);

      expect(axios.post).toHaveBeenCalledWith(
        `http://localhost:8080/api/calls/${mockRideId}/offer/${mockUserId}`,
        { offer: mockOffer },
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when sending offer fails', async () => {
      const mockOffer = { type: 'offer', sdp: 'mock-sdp' };
      const error = new Error('Failed to send offer');
      error.response = { data: { error: 'Failed to send offer' } };
      axios.post.mockRejectedValue(error);

      await expect(sendOffer(mockRideId, mockUserId, mockOffer)).rejects.toThrow('Failed to send offer');
    });
  });

  describe('sendAnswer', () => {
    it('should POST answer to target user', async () => {
      const mockAnswer = { type: 'answer', sdp: 'mock-sdp' };
      const mockResponse = {
        data: { message: 'Answer sent successfully' }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await sendAnswer(mockRideId, mockUserId, mockAnswer);

      expect(axios.post).toHaveBeenCalledWith(
        `http://localhost:8080/api/calls/${mockRideId}/answer/${mockUserId}`,
        { answer: mockAnswer },
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when sending answer fails', async () => {
      const mockAnswer = { type: 'answer', sdp: 'mock-sdp' };
      const error = new Error('Failed to send answer');
      error.response = { data: { error: 'Failed to send answer' } };
      axios.post.mockRejectedValue(error);

      await expect(sendAnswer(mockRideId, mockUserId, mockAnswer)).rejects.toThrow('Failed to send answer');
    });
  });

  describe('sendIceCandidate', () => {
    it('should POST ICE candidate to target user', async () => {
      const mockCandidate = { candidate: 'mock-ice-candidate', sdpMid: '0' };
      const mockResponse = {
        data: { message: 'ICE candidate sent successfully' }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await sendIceCandidate(mockRideId, mockUserId, mockCandidate);

      expect(axios.post).toHaveBeenCalledWith(
        `http://localhost:8080/api/calls/${mockRideId}/ice-candidate/${mockUserId}`,
        { candidate: mockCandidate },
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when sending ICE candidate fails', async () => {
      const mockCandidate = { candidate: 'mock-ice-candidate' };
      const error = new Error('Failed to send ICE candidate');
      error.response = { data: { error: 'Failed to send ICE candidate' } };
      axios.post.mockRejectedValue(error);

      await expect(sendIceCandidate(mockRideId, mockUserId, mockCandidate)).rejects.toThrow('Failed to send ICE candidate');
    });
  });

  describe('getCallStatus', () => {
    it('should GET call status for a ride', async () => {
      const mockResponse = {
        data: {
          call: {
            ride_id: mockRideId,
            active: true,
            participants: ['user1', 'user2']
          }
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getCallStatus(mockRideId);

      expect(axios.get).toHaveBeenCalledWith(
        `http://localhost:8080/api/calls/${mockRideId}/status`,
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when getting call status fails', async () => {
      const error = new Error('Call not found');
      error.response = { data: { error: 'Call not found' } };
      axios.get.mockRejectedValue(error);

      await expect(getCallStatus(mockRideId)).rejects.toThrow('Call not found');
    });
  });

  describe('getCallInfo', () => {
    it('should GET detailed call information', async () => {
      const mockResponse = {
        data: {
          call: {
            ride_id: mockRideId,
            participants: [
              { user_id: 'user1', username: 'john' },
              { user_id: 'user2', username: 'jane' }
            ]
          }
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getCallInfo(mockRideId);

      expect(axios.get).toHaveBeenCalledWith(
        `http://localhost:8080/api/calls/${mockRideId}/info`,
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when getting call info fails', async () => {
      const error = new Error('Failed to get call info');
      error.response = { data: { error: 'Failed to get call info' } };
      axios.get.mockRejectedValue(error);

      await expect(getCallInfo(mockRideId)).rejects.toThrow('Failed to get call info');
    });
  });

  describe('leaveCall', () => {
    it('should DELETE to leave call', async () => {
      const mockResponse = {
        data: { message: 'Left call successfully' }
      };
      axios.delete.mockResolvedValue(mockResponse);

      const result = await leaveCall(mockRideId);

      expect(axios.delete).toHaveBeenCalledWith(
        `http://localhost:8080/api/calls/${mockRideId}/leave`,
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when leaving call fails', async () => {
      const error = new Error('Failed to leave call');
      error.response = { data: { error: 'Failed to leave call' } };
      axios.delete.mockRejectedValue(error);

      await expect(leaveCall(mockRideId)).rejects.toThrow('Failed to leave call');
    });
  });
});
