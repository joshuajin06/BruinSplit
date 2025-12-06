import request from 'supertest';
import express from 'express';
import { generateTestToken } from '../helpers/authHelpers.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const profileControllerPath = resolve(__dirname, '../../src/controllers/profileController.js');
const authMiddlewarePath = resolve(__dirname, '../../src/middleware/authenticateUser.js');

// mock all controllers using test doubles
await jest.unstable_mockModule(profileControllerPath, () => ({
  getProfile: jest.fn((req, res) => res.status(200).json({ profile: { id: req.user.id } })),
  getProfileById: jest.fn((req, res) => res.status(200).json({ profile: { id: req.params.userId } })),
  updateProfile: jest.fn((req, res) => res.status(200).json({ message: 'Updated', profile: {} })),
  uploadProfilePhoto: jest.fn((req, res) => res.status(200).json({ message: 'Photo uploaded' })),
  deleteProfilePhoto: jest.fn((req, res) => res.status(200).json({ message: 'Photo deleted' }))
}));

// mock auth middleware
await jest.unstable_mockModule(authMiddlewarePath, () => ({
  authenticateUser: (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });
    req.user = { id: 'user-1111', email: 'test@example.com' };
    next();
  }
}));

const profileRoutes = await import('../../src/routes/profileRoute.js').then(m => m.default);

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/profile', profileRoutes);
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({ error: err.message });
  });
  return app;
};

describe('Profile Routes Integration', () => {
  let app;
  let authToken;

  beforeEach(() => {
    app = createTestApp();
    authToken = generateTestToken('user-1111', 'test@example.com');
    jest.clearAllMocks();
  });

  describe('GET /api/profile/me', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/profile/me');

      expect(response.status).toBe(401);
    });

    test('should accept authenticated request', async () => {
      const response = await request(app)
        .get('/api/profile/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/profile/:userId', () => {
    test('should work without authentication', async () => {
      const response = await request(app)
        .get('/api/profile/user-1111');

      expect(response.status).toBe(200);
    });
  });

  describe('PUT /api/profile/me', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .put('/api/profile/me')
        .send({ username: 'anish_kumar' });

      expect(response.status).toBe(401);
    });
  });
});

