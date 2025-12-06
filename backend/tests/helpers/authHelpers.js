import jwt from 'jsonwebtoken';

// generate a test JWT token
export function generateTestToken(userId = 'user-1111', email = 'test@example.com') {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jest-testing-12345';
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

