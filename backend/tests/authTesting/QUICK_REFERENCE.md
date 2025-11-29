# Quick Reference - Auth Tests

## Run Tests

```bash
# All auth tests
npm run test:auth

# All tests
npm test

# Watch mode (auto-rerun on file change)
npm run test:watch

# With coverage report
npm run test:coverage
```

## Test Files

| File | Purpose | Tests |
|------|---------|-------|
| `authController.test.js` | Test signup & login controller validation | 8 tests |
| `authRoutes.test.js` | Test HTTP routes (signup, login, me, logout, change-password) | 30 tests |

## What's Tested

### Auth Controller
- ✅ Signup requires email, username, password
- ✅ Password must be 8+ characters
- ✅ Login requires email and password
- ✅ Error handling

### Auth Routes
- ✅ POST /api/auth/signup (user registration)
- ✅ POST /api/auth/login (user authentication)
- ✅ GET /api/auth/me (get current user - protected)
- ✅ POST /api/auth/logout (logout - protected)
- ✅ POST /api/auth/change-password (change password - protected)

### Test Coverage
- Input validation (required fields)
- Password validation (minimum length)
- HTTP methods (POST vs GET)
- Content-Type (JSON)
- Authentication headers
- Error responses (400, 401)

## Test Results

```
✅ 38 tests passing
✅ 2 test suites passing
✅ ~3 seconds execution time
```

## Test Examples

### Validation Test
```javascript
test('should reject login without email', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ password: 'TestPassword123' });

  expect(response.status).toBe(400);
  expect(response.body.error).toContain('Email and password are required');
});
```

### Protected Route Test
```javascript
test('should require authentication token', async () => {
  const response = await request(app)
    .get('/api/auth/me');

  expect(response.status).toBe(401);
});
```

## Configuration

- **jest.config.js** - Jest configuration
- **jest.setup.js** - Makes jest globals available for ESM
- **package.json** - Test scripts

## Key Commands

| Command | Purpose |
|---------|---------|
| `npm run test:auth` | Run auth tests |
| `npm test` | Run all tests |
| `npm run test:watch` | Auto-rerun on file changes |
| `npm run test:coverage` | Show coverage report |

## Endpoints Tested

| Method | Endpoint | Auth? | Tests |
|--------|----------|-------|-------|
| POST | /api/auth/signup | No | 8 |
| POST | /api/auth/login | No | 5 |
| GET | /api/auth/me | Yes | 4 |
| POST | /api/auth/logout | Yes | 3 |
| POST | /api/auth/change-password | Yes | 3 |
| Various | All endpoints | - | 10 |

## Typical Test Output

```
PASS tests/authTesting/authController.test.js
  Auth Controller
    signup
      ✓ should validate that email is required
      ✓ should validate that password is required
      ✓ should validate that username is required
      ✓ should validate password minimum length is 8 characters
      ✓ should call next with error if service throws error
    login
      ✓ should validate that email is required
      ✓ should validate that password is required
      ✓ should return 400 when both email and password are missing

PASS tests/authTesting/authRoutes.test.js
  Auth Routes
    POST /api/auth/signup
      ✓ should accept signup request with valid data structure
      ✓ should reject signup without email
      ✓ should reject signup without username
      ✓ should reject signup without password
      ✓ should reject signup with password shorter than 8 characters
      ✓ should pass validation with valid password
      ✓ should send Content-Type application/json
    POST /api/auth/login
      ✓ should accept login request with email and password
      ✓ should reject login without email
      ✓ should reject login without password
      ✓ should reject login without both email and password
      ✓ should send Content-Type application/json
    GET /api/auth/me
      ✓ should require authentication token
      ✓ should accept Bearer token in Authorization header
      ✓ should reject malformed Authorization header
      ✓ should send Content-Type application/json
    POST /api/auth/logout
      ✓ should require authentication token
      ✓ should accept Bearer token in Authorization header
      ✓ should send Content-Type application/json
    POST /api/auth/change-password
      ✓ should require authentication token
      ✓ should accept Bearer token in Authorization header
      ✓ should reject change-password without both passwords
      ✓ should send Content-Type application/json
    HTTP Methods
      ✓ POST /api/auth/signup should be POST method
      ✓ POST /api/auth/login should be POST method
      ✓ GET /api/auth/me should be GET method
      ✓ POST /api/auth/logout should be POST method
      ✓ POST /api/auth/change-password should be POST method
    Request Content-Type
      ✓ signup should accept JSON content
      ✓ login should accept JSON content

Test Suites: 2 passed, 2 total
Tests:       38 passed, 38 total
Time:        2.981 s
```

## Next Steps

1. Run tests with `npm run test:auth`
2. Check README.md for detailed documentation
3. Add more tests as features are added
4. Integrate into CI/CD pipeline

## Troubleshooting

### Tests not running?
```bash
cd backend
npm install
npm run test:auth
```

### Module errors?
Make sure you're using `npm run test:auth` (not raw jest).

### Tests timing out?
Increase timeout in specific test:
```javascript
test('my test', async () => {
  // test code
}, 10000); // 10 second timeout
```
