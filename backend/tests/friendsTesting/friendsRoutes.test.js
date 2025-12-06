import request from 'supertest';
import express from 'express';
import friendsRoutes from '../../src/routes/friendsRoute.js';
import { generateTestToken } from '../helpers/authHelpers.js';

// mock all controllers (another insane block xD)
jest.mock('../../src/controllers/friendsController.js', () => ({
  sendFriendRequest: jest.fn((req, res) => res.status(201).json({ message: 'Request sent' })),
  acceptFriendRequest: jest.fn((req, res) => res.status(200).json({ message: 'Accepted' })),
  rejectFriendRequest: jest.fn((req, res) => res.status(200).json({ message: 'Rejected' })),
  removeFriend: jest.fn((req, res) => res.status(200).json({ message: 'Removed' })),
  getFriends: jest.fn((req, res) => res.json({ friends: [] })),
  getPendingRequests: jest.fn((req, res) => res.json({ sent: [], received: [] })),
  getFriendCount: jest.fn((req, res) => res.json({ friend_count: 0 })),
  getUserFriends: jest.fn((req, res) => res.json({ friends: [] })),
  getFriendRides: jest.fn((req, res) => res.json({ rides: [] })),
  getFriendsUpcomingRides: jest.fn((req, res) => res.json({ rides: [] }))
}));

// mock auth middleware
jest.mock('../../src/middleware/authenticateUser.js', () => ({
  authenticateUser: (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });
    req.user = { id: 'user-1111', email: 'test@example.com' };
    next();
  }
}));

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/friends', friendsRoutes);
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({ error: err.message });
  });
  return app;
};

describe('Friends Routes Integration', () => {
  let app;
  let authToken;

  beforeEach(() => {
    app = createTestApp();
    authToken = generateTestToken('user-1111', 'test@example.com');
    jest.clearAllMocks();
  });

  describe('POST /api/friends/request/:userId', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/friends/request/user-2222');

      expect(response.status).toBe(401);
    });

    test('should accept authenticated request', async () => {
      const response = await request(app)
        .post('/api/friends/request/user-2222')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(201);
    });
  });

  describe('GET /api/friends', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/friends');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/friends/count/:userId', () => {
    test('should work without authentication', async () => {
      const response = await request(app)
        .get('/api/friends/count/user-1111');

      expect(response.status).toBe(200);
    });
  });
});

