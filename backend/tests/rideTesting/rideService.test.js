// use unstable_mockModule with absolute path for ES modules
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const supabasePath = resolve(__dirname, '../../src/supabase.js');

const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
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
import { 
  createRide, 
  joinRideService, 
  deleteRideService,
  approveRideRequestService,
  getConfirmedMemberCount 
} from '../../src/services/rideService.js';

describe('Ride Service', () => {
  let mockQueryBuilder;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // create fresh mock query builder for each test
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
      then: jest.fn(function(resolve, reject) {
        return Promise.resolve(this._response).then(resolve, reject);
      }),
      _response: { data: null, error: null }
    };

    // set up the mock to return our query builder
    supabase.from.mockReturnValue(mockQueryBuilder);
  });

  describe('createRide', () => {
    test('should create ride with valid data', async () => {
      const rideData = {
        owner_id: 'user-1111',
        origin_text: 'UCLA',
        destination_text: 'LAX',
        departAt: new Date('2025-12-15T14:00:00Z'),
        platformUpper: 'UBER',
        maxSeats: 4,
        notes: 'justins cave'
      };

      const mockRide = { id: 'ride-3535', ...rideData, platform: 'UBER', max_seats: 4 };
      mockQueryBuilder._response = { data: mockRide, error: null };
      mockQueryBuilder.single.mockResolvedValue({ data: mockRide, error: null });

      const result = await createRide(rideData);

      expect(result).toEqual(mockRide);
      expect(supabase.from).toHaveBeenCalledWith('rides');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([expect.objectContaining({
        origin_text: 'UCLA',
        destination_text: 'LAX',
        platform: 'UBER'
      })]);
    });

    test('should throw error on database failure', async () => {
      const rideData = {
        owner_id: 'user-1111',
        origin_text: 'UCLA',
        destination_text: 'LAX',
        departAt: new Date(),
        platformUpper: 'UBER',
        maxSeats: 4
      };

      mockQueryBuilder._response = { data: null, error: { message: 'Database error' } };
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: { message: 'Database error' } });

      await expect(createRide(rideData)).rejects.toThrow();
    });
  });

  describe('joinRideService', () => {
    test('should throw error when ride not found', async () => {
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      await expect(joinRideService('invalid-ride', 'user-1111')).rejects.toThrow('Ride not found');
    });
  });

  describe('deleteRideService', () => {
    test('should delete ride when user is owner', async () => {
      const rideId = 'ride-3535';
      const userId = 'user-1111';

      // mock ride exists and user is owner
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: { id: rideId, owner_id: userId }, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const result = await deleteRideService(rideId, userId);

      expect(result.message).toBe('Ride has been deleted successfully');
      expect(supabase.from).toHaveBeenCalledWith('ride_members');
      expect(supabase.from).toHaveBeenCalledWith('rides');
    });

    test('should throw error when user is not owner', async () => {
      const rideId = 'ride-3535';
      const userId = 'user-2222';

      mockQueryBuilder.single.mockResolvedValue({ 
        data: { id: rideId, owner_id: 'user-1111' }, 
        error: null 
      });

      await expect(deleteRideService(rideId, userId)).rejects.toThrow('Unauthorized');
    });
  });

  describe('approveRideRequestService', () => {
    test('should throw error when not owner', async () => {
      mockQueryBuilder.single.mockResolvedValue({ 
        data: { id: 'ride-3535', owner_id: 'user-1111' }, 
        error: null 
      });

      await expect(
        approveRideRequestService('ride-3535', 'user-2222', 'user-3333')
      ).rejects.toThrow('Unauthorized');
    });
  });
});