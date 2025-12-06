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
import { getProfileService, updateProfileService } from '../../src/services/profileService.js';

describe('Profile Service', () => {
  let mockQueryBuilder;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
      then: jest.fn(function(resolve, reject) {
        return Promise.resolve(this._response).then(resolve, reject);
      }),
      _response: { data: null, error: null }
    };

    supabase.from = jest.fn(() => mockQueryBuilder);
  });

  describe('getProfileService', () => {
    test('should get profile successfully', async () => {
      const mockProfile = {
        id: 'user-1111',
        username: 'anish_kumar',
        first_name: 'Anish',
        last_name: 'Kumar',
        email: 'anish@example.com'
      };
      mockQueryBuilder.single.mockResolvedValue({ data: mockProfile, error: null });

      const result = await getProfileService('user-1111');

      expect(result).toEqual(mockProfile);
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'user-1111');
    });

    test('should throw error when profile not found', async () => {
      mockQueryBuilder.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      await expect(getProfileService('user-1111')).rejects.toThrow('Profile not found');
    });
  });

  describe('updateProfileService', () => {
    test('should update profile successfully', async () => {
      const updates = { first_name: 'Anish', username: 'anish_kumar' };
      const mockUpdated = { id: 'user-1111', ...updates };
      
      // mock username check (no existing user)
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      // mock update
      mockQueryBuilder.single.mockResolvedValue({ data: mockUpdated, error: null });

      const result = await updateProfileService('user-1111', updates);

      expect(result).toEqual(mockUpdated);
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    test('should throw error when username already taken', async () => {
      const updates = { username: 'taken_username' };
      
      mockQueryBuilder.maybeSingle.mockResolvedValue({ 
        data: { id: 'user-2222' }, 
        error: null 
      });

      await expect(updateProfileService('user-1111', updates)).rejects.toThrow('Username already taken');
    });

    test('should throw error when no valid fields', async () => {
      const updates = { invalid_field: 'value' };

      await expect(updateProfileService('user-1111', updates)).rejects.toThrow('No valid fields to update');
    });
  });
});

