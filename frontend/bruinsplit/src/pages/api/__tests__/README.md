# BruinSplit API Test Suite

This directory contains comprehensive tests for the BruinSplit frontend API helper functions.

## Test Structure

### Unit Tests (Mocked)
- **rides.test.js** - Tests for rides API helpers (getRides, createRide, joinRide, etc.)
- **users.test.js** - Tests for users/auth API helpers (getUsers, createUser, getUserId)
- **profile.test.js** - Tests for profile API helpers (updateProfile)

Unit tests use Jest with mocked axios responses to test the logic and correct API calls without requiring a backend server.

### Integration Tests (Live Backend)
- **integration.test.js** - End-to-end tests against a running backend server

Integration tests validate that the API helpers correctly communicate with the actual backend endpoints.

## Prerequisites

### For Unit Tests
```bash
cd /Users/jaden/Bruin\ Split/BruinSplit/frontend/bruinsplit
npm install --save-dev jest @types/jest
```

### For Integration Tests
1. Backend server must be running on `http://localhost:8080`
2. Database should be seeded with test data
3. (Optional) Set `TEST_TOKEN` environment variable with a valid JWT token to test authenticated endpoints

## Running Tests

### Run All Unit Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test rides.test.js
npm test users.test.js
npm test profile.test.js
```

### Run Unit Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Integration Tests
```bash
# Without authentication (public endpoints only)
npm run test:integration

# With authentication (all endpoints)
TEST_TOKEN=your-jwt-token npm run test:integration
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

## Test Coverage

### Rides API (`rides.js`)
- ✅ GET /api/rides - fetch all rides (public)
- ✅ GET /api/rides/:id - fetch ride by ID (public)
- ✅ GET /api/rides/my-rides - fetch user's rides (auth required)
- ✅ POST /api/rides - create ride (auth required)
- ✅ POST /api/rides/:id/join - join ride (auth required)
- ✅ DELETE /api/rides/:id/leave - leave ride (auth required)
- ✅ DELETE /api/rides/:id - delete ride (auth required, owner only)
- ✅ PUT /api/rides/:id - update ride (auth required, owner only)

### Users API (`users.js`)
- ✅ GET /api/users - fetch all users
- ✅ GET /api/users/username/:username - fetch user by username
- ✅ POST /api/auth/signup - create new user

### Profile API (`profile.js`)
- ✅ PUT /api/profile/:userId - update user profile

## Test Scenarios Covered

### Authentication
- ✅ Requests with valid JWT token
- ✅ Requests without token (public endpoints)
- ✅ Token retrieval from localStorage
- ✅ Authorization header injection

### Error Handling
- ✅ Network errors
- ✅ Validation errors (400)
- ✅ Authentication errors (401)
- ✅ Not found errors (404)
- ✅ Conflict errors (409)
- ✅ Server errors (500)

### Data Validation
- ✅ Required fields
- ✅ Data type validation
- ✅ Response structure validation
- ✅ Edge cases (empty data, special characters, etc.)

## Adding New Tests

When adding a new API helper function:

1. **Add unit test** in the corresponding test file:
```javascript
describe('newFunction', () => {
  it('should call the correct endpoint with correct parameters', async () => {
    // Mock axios response
    axios.get.mockResolvedValue({ data: { ... } });
    
    // Call your function
    const result = await newFunction(params);
    
    // Assert
    expect(axios.get).toHaveBeenCalledWith('expected-url');
    expect(result).toEqual(expectedResult);
  });
});
```

2. **Add integration test** in `integration.test.js`:
```javascript
await testEndpoint('GET /api/new-endpoint - description', async () => {
  const response = await axios.get(`${BASE_URL}/new-endpoint`);
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  // Add more assertions
}, requiresAuth);
```

## Continuous Integration

These tests can be integrated into a CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run unit tests
  run: npm test -- --ci --coverage

- name: Start backend server
  run: cd backend && npm start &
  
- name: Run integration tests
  run: TEST_TOKEN=${{ secrets.TEST_TOKEN }} npm run test:integration
```

## Troubleshooting

### "Cannot find module 'axios'" error
```bash
npm install axios
```

### "localStorage is not defined" error in tests
The unit tests include a localStorage mock. If you see this error, ensure the mock is properly set up in the test file.

### Integration tests fail with "ECONNREFUSED"
Make sure the backend server is running on http://localhost:8080 before running integration tests.

### Integration tests skip authenticated endpoints
Set the TEST_TOKEN environment variable with a valid JWT token from your backend.

## Best Practices

1. **Isolate tests** - Each test should be independent and not rely on other tests
2. **Mock external dependencies** - Unit tests should not make real network calls
3. **Test edge cases** - Include tests for error scenarios, empty data, etc.
4. **Keep tests simple** - Each test should verify one specific behavior
5. **Use descriptive names** - Test names should clearly describe what they're testing
6. **Clean up** - Use beforeEach/afterEach to reset state between tests

## Future Improvements

- [ ] Add tests for events API (when implemented)
- [ ] Add tests for authentication flow (login/logout)
- [ ] Add performance tests
- [ ] Add E2E tests with Playwright/Cypress
- [ ] Set up test coverage reporting
- [ ] Add mutation testing
