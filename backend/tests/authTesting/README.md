# Authentication Test Suite

This directory contains Jest tests for the BruinSplit backend authentication system.

## Test Files

### 1. `authController.test.js`
Tests for the authentication controller (signup and login).

**What it tests:**
- Signup validation (email, username, password required)
- Password minimum length validation (8 characters)
- Login validation (email and password required)
- Error handling structure

**Run**: `npm run test:auth`

### 2. `authRoutes.test.js`
Integration tests for all authentication HTTP routes.

**What it tests:**
- **POST /api/auth/signup** - User registration
  - Required fields validation
  - Password length requirements
  - Content-Type handling

- **POST /api/auth/login** - User authentication
  - Email and password requirements
  - Response format

- **GET /api/auth/me** - Get current user (protected)
  - Authentication token requirement
  - Bearer token format
  - 401 responses for invalid/missing tokens

- **POST /api/auth/logout** - User logout (protected)
  - Authentication requirement
  - Response format

- **POST /api/auth/change-password** - Change password (protected)
  - Authentication requirement
  - Password validation
  - Current and new password requirements

**Run**: `npm run test:auth`

## Running Tests

### Run all auth tests
```bash
npm run test:auth
```

### Run all tests (including other test suites)
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- authController.test.js
```

## Test Results

```
PASS tests/authTesting/authController.test.js
PASS tests/authTesting/authRoutes.test.js

Test Suites: 2 passed, 2 total
Tests:       38 passed, 38 total
```

## Test Coverage

The tests cover:
- ✅ **Input Validation**: Email, username, password requirements
- ✅ **Password Rules**: Minimum 8 characters
- ✅ **HTTP Methods**: POST/GET for correct endpoints
- ✅ **Authentication**: Bearer token handling, 401 responses
- ✅ **Response Formats**: JSON content-type
- ✅ **Error Handling**: Missing fields, invalid tokens
- ✅ **All Auth Endpoints**:
  - Signup
  - Login
  - Get User Info (/me)
  - Logout
  - Change Password

## Test Structure

Each test file follows this pattern:

```javascript
describe('Feature', () => {
  describe('Specific functionality', () => {
    test('should do something', () => {
      // Arrange
      const testData = { ... };

      // Act
      const result = await function(testData);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

## Key Testing Patterns

### Testing Validation
```javascript
test('should reject login without email', async () => {
  const loginData = { password: 'TestPassword123' };

  const response = await request(app)
    .post('/api/auth/login')
    .send(loginData);

  expect(response.status).toBe(400);
  expect(response.body.error).toContain('Email and password are required');
});
```

### Testing Protected Routes
```javascript
test('should require authentication token', async () => {
  const response = await request(app)
    .get('/api/auth/me');

  expect(response.status).toBe(401);
});
```

### Testing HTTP Methods
```javascript
test('POST /api/auth/signup should be POST method', async () => {
  const response = await request(app)
    .get('/api/auth/signup'); // Wrong method

  expect(response.status).not.toBe(200);
});
```

## Configuration Files

- `jest.config.js` - Jest configuration for ES modules
- `jest.setup.js` - Setup file that makes jest globals available
- `package.json` - Test scripts and dependencies

## Environment

Tests run with these environment variables set:
- `JWT_SECRET` = 'test-secret-key-for-jest-testing-12345'
- `JWT_EXPIRES_IN` = '7d'

These are configured in `jest.setup.js`.

## Dependencies

- **jest** - Testing framework
- **supertest** - HTTP testing library for Express
- **express** - Web framework (for testing routes)

## Notes

- Tests use `supertest` to test HTTP endpoints without starting the server
- Tests mock the database layer (Supabase)
- Tests validate request/response structure and error handling
- Some tests may fail if database is missing (expected behavior for integration tests)

## Common Issues

### "jest is not defined"
This is fixed by the `jest.setup.js` file. Make sure it's loaded in `jest.config.js`.

### Module import errors
Ensure you're running tests with: `node --experimental-vm-modules ./node_modules/jest/bin/jest.js`

This is configured in `package.json` scripts.

## Future Improvements

1. Add tests with mocked database responses
2. Add tests for successful signup/login with real JWT verification
3. Add tests for change password flow
4. Add tests for rate limiting
5. Add tests for email validation
6. Add tests for password complexity rules
