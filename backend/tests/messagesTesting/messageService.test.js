import { createMessage, getMessagesForRide } from '../../src/services/messageService.js';
import { supabase } from '../../src/supabase.js';

jest.mock('../../src/supabase.js');

describe('Message Service', () => {
  let mockQueryBuilder;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
      then: jest.fn(function(resolve, reject) {
        return Promise.resolve(this._response).then(resolve, reject);
      }),
      _response: { data: null, error: null }
    };

    supabase.from = jest.fn(() => mockQueryBuilder);
  });

  describe('createMessage', () => {
    test('should create message when user is ride member', async () => {
      const mockMessage = { id: 'msg-3535', ride_id: 'ride-3535', user_id: 'user-1111', content: 'test message' };
      
      // mock user is member
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: { id: 'member-1111' }, error: null });
      // mock insert message
      mockQueryBuilder.single.mockResolvedValue({ data: mockMessage, error: null });

      const result = await createMessage('ride-3535', 'user-1111', 'test message');

      expect(result).toEqual(mockMessage);
      expect(supabase.from).toHaveBeenCalledWith('ride_members');
      expect(supabase.from).toHaveBeenCalledWith('messages');
    });

    test('should throw error when user is not ride member', async () => {
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(createMessage('ride-3535', 'user-1111', 'test')).rejects.toThrow('not a member');
    });
  });

  describe('getMessagesForRide', () => {
    test('should get messages when user is member', async () => {
      const mockMessages = [{ id: 'msg-3535', content: 'test' }];
      
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: { id: 'member-1111' }, error: null });
      mockQueryBuilder.order.mockResolvedValue({ data: mockMessages, error: null });

      const result = await getMessagesForRide('ride-3535', 'user-1111');

      expect(result).toEqual(mockMessages);
    });

    test('should throw error when user is not member', async () => {
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(getMessagesForRide('ride-3535', 'user-1111')).rejects.toThrow('not a member');
    });
  });
});

