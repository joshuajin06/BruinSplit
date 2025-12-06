import { createMockRequest, createMockResponse, createMockNext } from '../helpers/testHelpers.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// use unstable_mockModule with absolute path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rideServicePath = resolve(__dirname, '../../src/services/rideService.js');

// create mock functions that will be used as test doubles
// these mocks isolate the controller from the service layer
const mockRideService = {
  createRide: jest.fn(),
  enrichRide: jest.fn(),
  getConfirmedMemberCount: jest.fn(),
  joinRideService: jest.fn(),
  deleteRideService: jest.fn(),
  leaveRideService: jest.fn(),
  getMyRidesService: jest.fn(),
  updateRideService: jest.fn(),
  getPendingRequestsService: jest.fn(),
  approveRideRequestService: jest.fn(),
  rejectRideRequestService: jest.fn(),
  kickMemberService: jest.fn(),
  getMyPendingRidesService: jest.fn(),
  transferOwnershipService: jest.fn()
};

await jest.unstable_mockModule(rideServicePath, () => mockRideService);

const { postRide, joinRide, deleteRide, updateRide } = await import('../../src/controllers/ridesController.js');
const rideService = await import(rideServicePath);

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
      const mockRide = { id: 'ride-3535', origin_text: 'UCLA', destination_text: 'LAX', owner_id: 'user-1111' };
      rideService.createRide.mockResolvedValue(mockRide);

      await postRide(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ride created successfully.',
        ride: mockRide
      });
      expect(rideService.createRide).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_id: 'user-1111',
          origin_text: 'UCLA',
          destination_text: 'LAX',
          platformUpper: 'UBER',
          maxSeats: 4
        })
      );
    });

    test('should return 400 when origin is missing', async () => {
      req.body = {
        destination_text: 'LAX',
        depart_at: '2025-12-15T14:00:00Z',
        platform: 'UBER',
        max_seats: 4
      };
      req.user = { id: 'user-1111' };

      await postRide(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('joinRide', () => {
    test('should join ride successfully', async () => {
      req.params = { id: 'ride-3535' };
      req.user = { id: 'user-1111' };
      const mockMember = { id: 'member-1111', ride_id: 'ride-3535', user_id: 'user-1111' };
      rideService.joinRideService.mockResolvedValue(mockMember);

      await joinRide(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully joined ride',
        member: mockMember
      });
      expect(rideService.joinRideService).toHaveBeenCalledWith('ride-3535', 'user-1111');
    });
  });

  describe('deleteRide', () => {
    test('should delete ride when user is owner', async () => {
      req.params = { id: 'ride-3535' };
      req.user = { id: 'user-1111' };
      rideService.deleteRideService.mockResolvedValue({ message: 'Ride deleted' });

      await deleteRide(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ride deleted successfully'
      });
      expect(rideService.deleteRideService).toHaveBeenCalledWith('ride-3535', 'user-1111');
    });
  });

  describe('updateRide', () => {
    test('should update ride with valid data', async () => {
      req.params = { id: 'ride-3535' };
      req.body = { notes: 'i updated da notes' };
      req.user = { id: 'user-1111' };
      const updatedRide = { id: 'ride-3535', notes: 'i updated da notes' };
      rideService.updateRideService.mockResolvedValue(updatedRide);

      await updateRide(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(rideService.updateRideService).toHaveBeenCalledWith('ride-3535', 'user-1111', { notes: 'i updated da notes' });
    });
  });
});
