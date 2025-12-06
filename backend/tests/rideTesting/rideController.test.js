import { postRide, joinRide, deleteRide, updateRide } from '../../src/controllers/ridesController.js';
import * as rideService from '../../src/services/rideService.js';
import { createMockRequest, createMockResponse, createMockNext } from '../helpers/testHelpers.js';

// mock the service layer to isolate controller logic
jest.mock('../../src/services/rideService.js');

describe('Rides Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
    jest.clearAllMocks();
  });

  describe('postRide', () => {
    test('should create ride with valid data', async () => {
      req.body = {
        origin_text: 'UCLA',
        destination_text: 'LAX',
        depart_at: '2025-12-15T14:00:00Z',
        platform: 'UBER',
        max_seats: 4
      };
      req.user = { id: 'user-1111' };

      const mockRide = { id: 'ride-3535', ...req.body, owner_id: 'user-1111' };
      rideService.createRide.mockResolvedValue(mockRide);

      await postRide(req, res, next);

      expect(rideService.createRide).toHaveBeenCalledWith(expect.objectContaining({
        origin_text: 'UCLA',
        destination_text: 'LAX',
        platformUpper: 'UBER'
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ride created successfully.',
        ride: mockRide
      });
    });

    test('should return 400 when missing required fields', async () => {
      req.body = { origin_text: 'UCLA' };
      req.user = { id: 'user-1111' };

      await postRide(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required fields.'
      });
      expect(rideService.createRide).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid platform', async () => {
      req.body = {
        origin_text: 'UCLA',
        destination_text: 'LAX',
        depart_at: '2025-12-15T14:00:00Z',
        platform: 'INVALID',
        max_seats: 4
      };
      req.user = { id: 'user-1111' };

      await postRide(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(rideService.createRide).not.toHaveBeenCalled();
    });

    test('should handle service errors', async () => {
      req.body = {
        origin_text: 'UCLA',
        destination_text: 'LAX',
        depart_at: '2025-12-15T14:00:00Z',
        platform: 'UBER',
        max_seats: 4
      };
      req.user = { id: 'user-1111' };

      const error = new Error('Database error');
      rideService.createRide.mockRejectedValue(error);

      await postRide(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('joinRide', () => {
    test('should join ride successfully', async () => {
      req.params = { id: 'ride-3535' };
      req.user = { id: 'user-1111' };

      const mockMember = { id: 'member-1111', ride_id: 'ride-3535', user_id: 'user-1111', status: 'PENDING' };
      rideService.joinRideService.mockResolvedValue(mockMember);

      await joinRide(req, res, next);

      expect(rideService.joinRideService).toHaveBeenCalledWith('ride-3535', 'user-1111');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully joined ride',
        member: mockMember
      });
    });

    test('should return 400 when rideId missing', async () => {
      req.params = {};
      req.user = { id: 'user-1111' };

      await joinRide(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(rideService.joinRideService).not.toHaveBeenCalled();
    });
  });

  describe('updateRide', () => {
    test('should update ride when owner', async () => {
      req.params = { id: 'ride-3535' };
      req.body = { notes: 'i updated da notes' };
      req.user = { id: 'user-1111' };

      const mockUpdatedRide = { id: 'ride-3535', notes: 'i updated da notes' };
      rideService.updateRideService.mockResolvedValue(mockUpdatedRide);

      await updateRide(req, res, next);

      expect(rideService.updateRideService).toHaveBeenCalledWith('ride-3535', 'user-1111', { notes: 'i updated da notes' });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return 400 for invalid origin_text', async () => {
      req.params = { id: 'ride-3535' };
      req.body = { origin_text: '' };
      req.user = { id: 'user-1111' };

      await updateRide(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(rideService.updateRideService).not.toHaveBeenCalled();
    });
  });
});