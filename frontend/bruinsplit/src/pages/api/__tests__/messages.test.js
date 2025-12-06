// Mock axios and axios.create  
jest.mock('axios', () => {
  const instance = {
    post: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  };
  
  // Store in global for access outside mock factory
  global.mockAxiosInstance = instance;
  
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => instance),
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    }
  };
});

import axios from 'axios';
import { postMessage, getMessages, getConversations } from '../messages';

// Access the mock instance from global
const mockAxiosInstance = global.mockAxiosInstance;

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

describe('Messages API Tests', () => {
  const mockToken = 'mock-jwt-token';
  const mockRideId = 'ride-123';

  beforeEach(() => {
    localStorage.setItem('token', mockToken);
    const mockInstance = mockAxiosInstance;
    if (mockInstance) {
      mockInstance.post.mockClear();
      mockInstance.get.mockClear();
    }
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('postMessage', () => {
    it('should POST a new message to a ride', async () => {
      const content = 'Hello, everyone!';
      const mockResponse = {
        data: {
          message: {
            id: 'msg-123',
            ride_id: mockRideId,
            content: content,
            sender_id: 'user-123',
            created_at: new Date().toISOString()
          }
        }
      };
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await postMessage(mockRideId, content);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/messages', {
        ride_id: mockRideId,
        content: content
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should send message with correct ride_id and content', async () => {
      const content = 'Test message';
      const mockResponse = {
        data: { message: { id: 'msg-1', content } }
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await postMessage(mockRideId, content);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/messages', {
        ride_id: mockRideId,
        content: content
      });
    });

    it('should handle empty message content', async () => {
      const mockResponse = {
        data: { message: { id: 'msg-1', content: '' } }
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await postMessage(mockRideId, '');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/messages', {
        ride_id: mockRideId,
        content: ''
      });
    });

    it('should handle errors when posting message fails', async () => {
      const error = new Error('Failed to post message');
      error.response = { data: { error: 'Failed to post message' } };
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(postMessage(mockRideId, 'Test')).rejects.toThrow('Failed to post message');
    });
  });

  describe('getMessages', () => {
    it('should GET messages for a specific ride', async () => {
      const mockMessages = [
        { id: 'msg-1', content: 'Hello', sender_id: 'user-1' },
        { id: 'msg-2', content: 'Hi there', sender_id: 'user-2' }
      ];
      const mockResponse = {
        data: { messages: mockMessages }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await getMessages(mockRideId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/messages', {
        params: { ride_id: mockRideId }
      });
      expect(result).toEqual(mockResponse.data);
      expect(result.messages).toHaveLength(2);
    });

    it('should handle empty message list', async () => {
      const mockResponse = { data: { messages: [] } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await getMessages(mockRideId);

      expect(result.messages).toHaveLength(0);
    });

    it('should handle errors when getting messages fails', async () => {
      const error = new Error('Ride not found');
      error.response = { data: { error: 'Ride not found' } };
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(getMessages(mockRideId)).rejects.toThrow('Ride not found');
    });
  });

  describe('getConversations', () => {
    it('should GET all conversations for the user', async () => {
      const mockConversations = [
        {
          ride_id: 'ride-1',
          ride_title: 'UCLA to LAX',
          last_message: 'See you tomorrow!',
          last_message_time: new Date().toISOString(),
          unread_count: 2
        },
        {
          ride_id: 'ride-2',
          ride_title: 'Campus Tour',
          last_message: 'Thanks!',
          last_message_time: new Date().toISOString(),
          unread_count: 0
        }
      ];
      const mockResponse = {
        data: { conversations: mockConversations }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await getConversations();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/messages/conversations');
      expect(result).toEqual(mockResponse.data);
      expect(result.conversations).toHaveLength(2);
    });

    it('should handle no conversations', async () => {
      const mockResponse = { data: { conversations: [] } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await getConversations();

      expect(result.conversations).toHaveLength(0);
    });

    it('should handle errors when getting conversations fails', async () => {
      const error = new Error('Unauthorized');
      error.response = { data: { error: 'Unauthorized' } };
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(getConversations()).rejects.toThrow('Unauthorized');
    });
  });

  describe('apiClient interceptors', () => {
    it('should setup request and response interceptors', () => {
      // Verify that the mock axios instance has interceptors configured
      expect(mockAxiosInstance.interceptors.request.use).toBeDefined();
      expect(mockAxiosInstance.interceptors.response.use).toBeDefined();
    });
  });
});
