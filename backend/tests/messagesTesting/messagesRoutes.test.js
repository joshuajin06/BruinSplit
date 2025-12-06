import request from 'supertest';
import express from 'express';
import { generateTestToken } from '../helpers/authHelpers.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const messagesControllerPath = resolve(__dirname, '../../src/controllers/messagesController.js');
const authMiddlewarePath = resolve(__dirname, '../../src/middleware/authenticateUser.js');

// mock all controllers using test doubles
await jest.unstable_mockModule(messagesControllerPath, () => ({
  postMessage: jest.fn((req, res) => res.status(201).json({ message: 'Message sent' })),
  getMessages: jest.fn((req, res) => res.json({ messages: [] })),
  getConversations: jest.fn((req, res) => res.json({ conversations: [] }))
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

const messagesRoutes = await import('../../src/routes/messagesRoute.js').then(m => m.default);

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/messages', messagesRoutes);
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({ error: err.message });
  });
  return app;
};

describe('Messages Routes Integration', () => {
  let app;
  let authToken;

  beforeEach(() => {
    app = createTestApp();
    authToken = generateTestToken('user-1111', 'test@example.com');
    jest.clearAllMocks();
  });

  describe('POST /api/messages', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({ ride_id: 'ride-3535', content: 'test' });

      expect(response.status).toBe(401);
    });

    test('should accept authenticated request', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ride_id: 'ride-3535', content: 'test message' });

      expect(response.status).toBe(201);
    });
  });

  describe('GET /api/messages', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/messages?ride_id=ride-3535');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/messages/conversations', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/messages/conversations');

      expect(response.status).toBe(401);
    });
  });
});

