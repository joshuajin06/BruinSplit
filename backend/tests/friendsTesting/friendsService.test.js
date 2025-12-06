import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const supabasePath = resolve(__dirname, '../../src/supabase.js');

// use unstable_mockModule with absolute path for ES modules
const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
  then: jest.fn(function(resolve, reject) {
    return Promise.resolve(this._response).then(resolve, reject);
  }),
  _response: { data: null, error: null }
};

await jest.unstable_mockModule(supabasePath, () => ({
  supabase: {
    from: jest.fn(() => mockQueryBuilder)
  }
}));

import { supabase } from '../../src/supabase.js';
import { sendFriendRequestService, acceptFriendRequestService } from '../../src/services/friendsService.js';

describe('Friends Service', () => {
  let mockQueryBuilder;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
      then: jest.fn(function(resolve, reject) {
        return Promise.resolve(this._response).then(resolve, reject);
      }),
      _response: { data: null, error: null }
    };

    supabase.from = jest.fn(() => mockQueryBuilder);
  });

  describe('sendFriendRequestService', () => {
    test('should throw error when sending to yourself', async () => {
      await expect(sendFriendRequestService('user-1111', 'user-1111')).rejects.toThrow('Cannot send friend request to yourself');
    });

    test('should create new friend request', async () => {
      const mockFriendship = { id: 'friendship-3535', requester_id: 'user-1111', addressee_id: 'user-2222', status: 'PENDING' };
      
      // mock user exists
      mockQueryBuilder.single.mockResolvedValueOnce({ data: { id: 'user-2222' }, error: null });
      // mock no existing friendship
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });
      // mock insert
      mockQueryBuilder.single.mockResolvedValueOnce({ data: mockFriendship, error: null });

      const result = await sendFriendRequestService('user-1111', 'user-2222');

      expect(result.status).toBe('PENDING');
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(supabase.from).toHaveBeenCalledWith('friendships');
    });

    test('should throw error when user does not exist', async () => {
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      await expect(sendFriendRequestService('user-1111', 'user-2222')).rejects.toThrow('User does not exist');
    });
  });

  describe('acceptFriendRequestService', () => {
    test('should accept friend request', async () => {
      const mockFriendship = { id: 'friendship-3535', status: 'PENDING' };
      const mockUpdated = { id: 'friendship-3535', status: 'ACCEPTED' };
      
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: mockFriendship, error: null });
      mockQueryBuilder.single.mockResolvedValue({ data: mockUpdated, error: null });

      const result = await acceptFriendRequestService('user-1111', 'user-2222');

      expect(result.message).toContain('accepted');
      expect(supabase.from).toHaveBeenCalledWith('friendships');
    });
  });
});

