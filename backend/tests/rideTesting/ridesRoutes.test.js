import request from 'supertest';
import express from 'express';
import { generateTestToken } from '../helpers/authHelpers.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ridesControllerPath = resolve(__dirname, '../../src/controllers/ridesController.js');
const authMiddlewarePath = resolve(__dirname, '../../src/middleware/authenticateUser.js');

// mock all controllers using test doubles
await jest.unstable_mockModule(ridesControllerPath, () => ({
  postRide: jest.fn((req, res) => res.status(201).json({ message: 'Ride created', ride: { id: 'ride-3535' } })),
  getRides: jest.fn((req, res) => res.json({ rides: [] })),
  joinRide: jest.fn((req, res) => res.status(201).json({ message: 'Joined' })),
  deleteRide: jest.fn((req, res) => res.status(200).json({ message: 'Deleted' })),
  updateRide: jest.fn((req, res) => res.status(200).json({ message: 'Updated' })),
  getRideById: jest.fn((req, res) => res.json({ ride: { id: req.params.id } })),
  getMyRides: jest.fn((req, res) => res.json({ rides: [] })),
  getPendingRequests: jest.fn((req, res) => res.json({ pending_requests: [] })),
  approveRequest: jest.fn((req, res) => res.status(200).json({ message: 'Approved' })),
  rejectRequest: jest.fn((req, res) => res.status(200).json({ message: 'Rejected' })),
  kickMember: jest.fn((req, res) => res.status(200).json({ message: 'Kicked' })),
  leaveRide: jest.fn((req, res) => res.status(200).json({ message: 'Left' })),
  getMyPendingRides: jest.fn((req, res) => res.json({ rides: [] })),
  transferOwnership: jest.fn((req, res) => res.status(200).json({ message: 'Transferred' }))
}));

// mock auth middleware
await jest.unstable_mockModule(authMiddlewarePath, () => ({
  authenticateUser: (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });
    req.user = { id: 'user-1111', email: 'test@example.com' };
    next();
  },
  maybeAuthenticateUser: (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) req.user = { id: 'user-1111' };
    next();
  }
}));

const ridesRoutes = await import('../../src/routes/ridesRoute.js').then(m => m.default);

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/rides', ridesRoutes);
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({ error: err.message });
  });
  return app;
};

describe('Rides Routes Integration', () => {
  let app;
  let authToken;

  beforeEach(() => {
    app = createTestApp();
    authToken = generateTestToken('user-1111', 'test@example.com');
    jest.clearAllMocks();
  });

  describe('POST /api/rides', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/rides')
        .send({ origin_text: 'UCLA', destination_text: 'LAX' });

      expect(response.status).toBe(401);
    });

    test('should accept authenticated request', async () => {
      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          origin_text: 'UCLA',
          destination_text: 'LAX',
          depart_at: '2025-12-15T14:00:00Z',
          platform: 'UBER',
          max_seats: 4
        });

      expect(response.status).toBe(201);
    });
  });

  describe('GET /api/rides', () => {
    test('should work without authentication', async () => {
      const response = await request(app)
        .get('/api/rides');

      expect(response.status).toBe(200);
    });

    test('should work with authentication', async () => {
      const response = await request(app)
        .get('/api/rides')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/rides/my-rides', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/rides/my-rides');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/rides/:id/join', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/rides/ride-3535/join');

      expect(response.status).toBe(401);
    });
  });
});