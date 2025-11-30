# Quick Start: Running BruinSplit API Tests

## Prerequisites
✅ All dependencies already installed  
✅ Jest and testing framework configured  
✅ Tests are ready to run

## Running Unit Tests

### Run all tests
```bash
cd /Users/jaden/Bruin\ Split/BruinSplit/frontend/bruinsplit
npm test
```

**Expected Output:**
```
Test Suites: 3 passed, 3 total
Tests:       26 passed, 26 total
Time:        ~0.4s
```

### Run tests with coverage
```bash
npm run test:coverage
```

**Coverage Summary:**
- **Statements:** 83.87%
- **Functions:** 100%
- **Lines:** 83.69%

### Watch mode (for development)
```bash
npm run test:watch
```

## Running Integration Tests

Integration tests validate against a **live backend server**.

### Step 1: Start the backend
```bash
cd /Users/jaden/Bruin\ Split/BruinSplit/backend
npm start
```

Wait for: `Server is running on 8080`

### Step 2: Get a test token (optional, for authenticated endpoints)
```bash
# Option A: Login via API
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your-username","password":"your-password"}'

# Option B: Signup for a new account
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testuser",
    "email":"test@ucla.edu",
    "password":"TestPass123",
    "first_name":"Test",
    "last_name":"User"
  }'
```

Copy the `token` from the response.

### Step 3: Run integration tests
```bash
cd /Users/jaden/Bruin\ Split/BruinSplit/frontend/bruinsplit

# Without token (public endpoints only)
npm run test:integration

# With token (all endpoints)
TEST_TOKEN=your-jwt-token npm run test:integration
```

**Expected Output:**
```
🧪 BruinSplit API Integration Tests
====================================

✓ Backend server is reachable at http://localhost:8080/api

============================================================
RIDES API INTEGRATION TESTS
============================================================
✓ GET /api/rides - fetch all rides
✓ GET /api/rides/:id - fetch ride by ID
✓ GET /api/rides/my-rides - fetch user rides
✓ POST /api/rides - create a ride
... (more tests)

============================================================
TEST SUMMARY
============================================================
✓ Passed: 15
✗ Failed: 0
⊘ Skipped: 3
Total: 18
```

## Test Files Location

```
frontend/bruinsplit/
├── src/pages/api/
│   ├── __tests__/
│   │   ├── rides.test.js       # Rides API tests
│   │   ├── users.test.js       # Users API tests
│   │   ├── profile.test.js     # Profile API tests
│   │   └── README.md           # Detailed test documentation
│   ├── rides.js                # Rides API helpers (UNDER TEST)
│   ├── users.js                # Users API helpers (UNDER TEST)
│   └── profile.js              # Profile API helpers (UNDER TEST)
├── scripts/
│   └── integration-test.js     # Integration test suite
├── jest.config.cjs             # Jest configuration
├── babel.config.cjs            # Babel configuration
└── TEST_REPORT.md              # Full test report

```

## What's Being Tested

### ✅ Rides API (8 functions)
- getRides() - GET /api/rides
- getRideById(id) - GET /api/rides/:id
- getMyRides() - GET /api/rides/my-rides 🔒
- createRide(data) - POST /api/rides 🔒
- joinRide(rideId) - POST /api/rides/:id/join 🔒
- leaveRide(rideId) - DELETE /api/rides/:id/leave 🔒
- deleteRide(rideId) - DELETE /api/rides/:id 🔒
- updateRide(id, data) - PUT /api/rides/:id 🔒

### ✅ Users API (3 functions)
- getUsers() - GET /api/users
- getUserId(username) - GET /api/users/username/:username
- createUser(data) - POST /api/auth/signup

### ✅ Profile API (1 function)
- updateProfile(userId, data) - PUT /api/profile/:userId 🔒

🔒 = Requires authentication token

## Test Results Summary

**Status:** ✅ ALL TESTS PASSING  
**Unit Tests:** 26/26 passed  
**Coverage:** 83.87% statements, 100% functions  
**Execution Time:** ~0.4 seconds

## Common Issues & Solutions

### Issue: "Cannot find module 'axios'"
```bash
npm install axios
```

### Issue: "Backend server is not running"
Make sure backend is running on http://localhost:8080 before integration tests.

### Issue: Integration tests skip authenticated endpoints
Set TEST_TOKEN environment variable with a valid JWT from signup/login.

### Issue: Tests fail with "localStorage is not defined"
This is already handled by mocks in the test files. If you see this, check that tests are running with Jest, not directly with Node.

## CI/CD Integration

Add to your GitHub Actions or CI pipeline:

```yaml
- name: Run API Tests
  run: |
    cd frontend/bruinsplit
    npm install
    npm test

- name: Check Coverage
  run: npm run test:coverage
```

## Next Steps

1. ✅ Tests are passing - API layer is validated
2. 📝 Read `TEST_REPORT.md` for detailed findings
3. 🔧 Consider implementing centralized axios instance (see recommendations)
4. 🚀 Ready to merge to main branch

---

**Quick Reference:**
- Unit tests: `npm test`
- Coverage: `npm run test:coverage`  
- Integration: `npm run test:integration`
- Documentation: `src/pages/api/__tests__/README.md`
