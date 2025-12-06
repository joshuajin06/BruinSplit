import request from 'supertest';
import express from 'express';
import messagesRoutes from '../../src/routes/messagesRoute.js';
import { generateTestToken } from '../helpers/authHelpers.js';

// mock all controllers
jest.mock('../../src/controllers/messagesController.js', () => ({
  postMessage: jest.fn((req, res) => res.status(201).json({ message: 'Message sent' })),
  getMessages: jest.fn((req, res) => res.json({ messages: [] })),
  getConversations: jest.fn((req, res) => res.json({ conversations: [] }))
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

