import { createMockRequest, createMockResponse, createMockNext } from '../helpers/testHelpers.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// use unstable_mockModule with absolute path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const friendsServicePath = resolve(__dirname, '../../src/services/friendsService.js');

// create mock functions that will be used as test doubles
// these mocks isolate the controller from the service layer
const mockFriendsService = {
  sendFriendRequestService: jest.fn(),
  acceptFriendRequestService: jest.fn(),
  rejectFriendRequestService: jest.fn(),
  removeFriendService: jest.fn(),
  getFriendsService: jest.fn(),
  getPendingFriendRequestsService: jest.fn(),
  getFriendCountService: jest.fn(),
  getFriendRidesService: jest.fn(),
  getFriendsUpcomingRidesService: jest.fn()
};

await jest.unstable_mockModule(friendsServicePath, () => mockFriendsService);

const { sendFriendRequest, acceptFriendRequest, getFriends } = await import('../../src/controllers/friendsController.js');
const friendsService = await import(friendsServicePath);

describe('Friends Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
    jest.clearAllMocks();
  });

  describe('sendFriendRequest', () => {
    test('should send friend request successfully', async () => {
      req.params = { userId: 'user-2222' };
      req.user = { id: 'user-1111' };
      friendsService.sendFriendRequestService.mockResolvedValue({ message: 'Friend request sent', status: 'PENDING' });

      await sendFriendRequest(req, res, next);

      expect(friendsService.sendFriendRequestService).toHaveBeenCalledWith('user-1111', 'user-2222');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('should return 400 when userId missing', async () => {
      req.params = {};
      req.user = { id: 'user-1111' };

      await sendFriendRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(friendsService.sendFriendRequestService).not.toHaveBeenCalled();
    });

    test('should handle service errors', async () => {
      req.params = { userId: 'user-2222' };
      req.user = { id: 'user-1111' };
      const error = new Error('Already friends');
      friendsService.sendFriendRequestService.mockRejectedValue(error);

      await sendFriendRequest(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('acceptFriendRequest', () => {
    test('should accept friend request', async () => {
      req.params = { userId: 'user-2222' };
      req.user = { id: 'user-1111' };
      friendsService.acceptFriendRequestService.mockResolvedValue({ message: 'Friend request accepted' });

      await acceptFriendRequest(req, res, next);

      expect(friendsService.acceptFriendRequestService).toHaveBeenCalledWith('user-1111', 'user-2222');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getFriends', () => {
    test('should get all friends', async () => {
      req.user = { id: 'user-1111' };
      const mockFriends = [{ id: 'user-2222', username: 'friend_user' }];
      friendsService.getFriendsService.mockResolvedValue(mockFriends);

      await getFriends(req, res, next);

      expect(friendsService.getFriendsService).toHaveBeenCalledWith('user-1111');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ friends: mockFriends });
    });
  });
});

