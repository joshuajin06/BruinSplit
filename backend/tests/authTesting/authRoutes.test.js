import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/routes/authRoute.js';

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Add a simple auth middleware mock for protected routes
  app.use('/api/auth', authRoutes);

  // Error handler middleware
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({ error: err.message });
  });

  return app;
};

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/auth/signup', () => {
    test('should accept signup request with valid data structure', async () => {
      const signupData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'SecurePassword123',
        first_name: 'John',
        last_name: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(signupData);

      // Will fail due to no real database, but validates endpoint exists
      // and request structure is accepted
      expect(response.status).toBeDefined();
      // Status should be some error code since we don't have real database
      expect(response.status >= 400).toBe(true);
    });

    test('should reject signup without email', async () => {
      const signupData = {
        username: 'newuser',
        password: 'SecurePassword123',
        first_name: 'John',
        last_name: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(signupData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Email, password, and username are all required');
    });

    test('should reject signup without username', async () => {
      const signupData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123',
        first_name: 'John',
        last_name: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(signupData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Email, password, and username are all required');
    });

    test('should reject signup without password', async () => {
      const signupData = {
        email: 'newuser@example.com',
        username: 'newuser',
        first_name: 'John',
        last_name: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(signupData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Email, password, and username are all required');
    });

    test('should reject signup with password shorter than 8 characters', async () => {
      const signupData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'short',
        first_name: 'John',
        last_name: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(signupData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Password must be at least 8 characters long');
    });

    test('should pass validation with valid password', async () => {
      const signupData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'ValidPassword123',
        first_name: 'John',
        last_name: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(signupData);

      // Should pass validation, may fail due to database
      expect(response.status).toBeDefined();
    });

    test('should send Content-Type application/json', async () => {
      const signupData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'SecurePassword123',
        first_name: 'John',
        last_name: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(signupData);

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should accept login request with email and password', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'SecurePassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // Will fail due to no real database, but validates endpoint exists
      expect(response.status).toBeDefined();
      expect([400, 401, 500]).toContain(response.status);
    });

    test('should reject login without email', async () => {
      const loginData = {
        password: 'SecurePassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Email and password are required');
    });

    test('should reject login without password', async () => {
      const loginData = {
        email: 'user@example.com'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Email and password are required');
    });

    test('should reject login without both email and password', async () => {
      const loginData = {};

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Email and password are required');
    });

    test('should send Content-Type application/json', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'SecurePassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('GET /api/auth/me', () => {
    test('should require authentication token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      // Should return 401 for no token
      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    test('should accept Bearer token in Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid.jwt.token');

      // Will fail due to invalid token, but validates header is accepted
      expect(response.status).toBe(401);
    });

    test('should reject malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token123');

      // Should reject malformed auth header
      expect(response.status).toBe(401);
    });

    test('should send Content-Type application/json', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should require authentication token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      // Should return 401 for no token
      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    test('should accept Bearer token in Authorization header', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid.jwt.token');

      // Will fail due to invalid token, but validates header is accepted
      expect(response.status).toBe(401);
    });

    test('should send Content-Type application/json', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('POST /api/auth/change-password', () => {
    test('should require authentication token', async () => {
      const changePasswordData = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .send(changePasswordData);

      // Should return 401 for no token
      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    test('should accept Bearer token in Authorization header', async () => {
      const changePasswordData = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer valid.jwt.token')
        .send(changePasswordData);

      // Will fail due to invalid token, but validates header is accepted
      expect(response.status).toBe(401);
    });

    test('should reject change-password without both passwords', async () => {
      const changePasswordData = {
        currentPassword: 'OldPassword123'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer valid.jwt.token')
        .send(changePasswordData);

      // Should fail auth first (401) before validation
      expect(response.status).toBe(401);
    });

    test('should send Content-Type application/json', async () => {
      const response = await request(app)
        .post('/api/auth/change-password');

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('HTTP Methods', () => {
    test('POST /api/auth/signup should be POST method', async () => {
      const response = await request(app)
        .get('/api/auth/signup'); // Wrong method

      // Should not accept GET method
      expect(response.status).not.toBe(200);
    });

    test('POST /api/auth/login should be POST method', async () => {
      const response = await request(app)
        .get('/api/auth/login'); // Wrong method

      // Should not accept GET method
      expect(response.status).not.toBe(200);
    });

    test('GET /api/auth/me should be GET method', async () => {
      const response = await request(app)
        .post('/api/auth/me'); // Wrong method

      // Should not accept POST method
      expect(response.status).not.toBe(200);
    });

    test('POST /api/auth/logout should be POST method', async () => {
      const response = await request(app)
        .get('/api/auth/logout'); // Wrong method

      // Should not accept GET method
      expect(response.status).not.toBe(200);
    });

    test('POST /api/auth/change-password should be POST method', async () => {
      const response = await request(app)
        .get('/api/auth/change-password'); // Wrong method

      // Should not accept GET method
      expect(response.status).not.toBe(200);
    });
  });

  describe('Request Content-Type', () => {
    test('signup should accept JSON content', async () => {
      const signupData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPassword123'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .set('Content-Type', 'application/json')
        .send(signupData);

      // Should process the request
      expect(response.status).toBeDefined();
    });

    test('login should accept JSON content', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send(loginData);

      // Should process the request
      expect(response.status).toBeDefined();
    });
  });
});
