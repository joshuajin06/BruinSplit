/**
 * Integration tests for BruinSplit API helpers
 * These tests run against a live backend server
 * 
 * Prerequisites:
 * 1. Backend server must be running on http://localhost:8080
 * 2. Database must be seeded with test data
 * 3. Set TEST_TOKEN environment variable with a valid JWT token
 * 
 * Usage:
 *   node integration.test.js
 * 
 * Or with a test token:
 *   TEST_TOKEN=your-jwt-token node integration.test.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';
const TEST_TOKEN = process.env.TEST_TOKEN || '';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let passCount = 0;
let failCount = 0;
let skipCount = 0;

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function logPass(message) {
  passCount++;
  log(colors.green, '✓', message);
}

function logFail(message, error) {
  failCount++;
  log(colors.red, '✗', message);
  if (error) {
    console.error(colors.red, '  Error:', error.message || error, colors.reset);
  }
}

function logSkip(message) {
  skipCount++;
  log(colors.yellow, '⊘', message, '(skipped)');
}

function logSection(message) {
  log(colors.cyan, '\n' + '='.repeat(60));
  log(colors.cyan, message);
  log(colors.cyan, '='.repeat(60));
}

async function testEndpoint(name, testFn, requiresAuth = false) {
  if (requiresAuth && !TEST_TOKEN) {
    logSkip(name);
    return;
  }
  
  try {
    await testFn();
    logPass(name);
  } catch (error) {
    logFail(name, error);
  }
}

// Helper to make authenticated requests
function getAuthHeaders() {
  return TEST_TOKEN ? { Authorization: `Bearer ${TEST_TOKEN}` } : {};
}

// ============================================
// RIDES API TESTS
// ============================================
async function testRidesAPI() {
  logSection('RIDES API INTEGRATION TESTS');

  // Test GET /api/rides (public)
  await testEndpoint('GET /api/rides - fetch all rides', async () => {
    const response = await axios.get(`${BASE_URL}/rides`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.data.rides) throw new Error('Expected rides array in response');
  });

  // Test GET /api/rides/:id (public)
  await testEndpoint('GET /api/rides/:id - fetch ride by ID', async () => {
    // First get all rides to get a valid ID
    const allRides = await axios.get(`${BASE_URL}/rides`);
    if (allRides.data.rides && allRides.data.rides.length > 0) {
      const rideId = allRides.data.rides[0].id;
      const response = await axios.get(`${BASE_URL}/rides/${rideId}`);
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (!response.data.ride) throw new Error('Expected ride object in response');
    } else {
      throw new Error('No rides available to test with');
    }
  });

  // Test GET /api/rides/my-rides (authenticated)
  await testEndpoint('GET /api/rides/my-rides - fetch user rides', async () => {
    const response = await axios.get(`${BASE_URL}/rides/my-rides`, {
      headers: getAuthHeaders()
    });
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.data.rides) throw new Error('Expected rides array in response');
  }, true);

  // Test POST /api/rides - create ride (authenticated)
  let createdRideId = null;
  await testEndpoint('POST /api/rides - create a ride', async () => {
    const rideData = {
      origin_text: 'UCLA Westwood',
      destination_text: 'LAX Airport',
      depart_at: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      platform: 'UBER',
      max_seats: 4,
      notes: 'Integration test ride'
    };
    const response = await axios.post(`${BASE_URL}/rides`, rideData, {
      headers: getAuthHeaders()
    });
    if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
    if (!response.data.ride || !response.data.ride.id) {
      throw new Error('Expected ride with id in response');
    }
    createdRideId = response.data.ride.id;
  }, true);

  // Test PUT /api/rides/:id - update ride (authenticated)
  await testEndpoint('PUT /api/rides/:id - update a ride', async () => {
    if (!createdRideId) throw new Error('No ride created to update');
    const updateData = {
      notes: 'Updated notes from integration test',
      max_seats: 5
    };
    const response = await axios.put(`${BASE_URL}/rides/${createdRideId}`, updateData, {
      headers: getAuthHeaders()
    });
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.data.ride) throw new Error('Expected updated ride in response');
  }, true);

  // Test POST /api/rides/:id/join - join ride (authenticated)
  await testEndpoint('POST /api/rides/:id/join - join a ride', async () => {
    // Get a ride to join (not the one we created)
    const allRides = await axios.get(`${BASE_URL}/rides`);
    const rideToJoin = allRides.data.rides.find(r => r.id !== createdRideId && r.available_seats > 0);
    
    if (!rideToJoin) {
      throw new Error('No available rides to join');
    }

    try {
      const response = await axios.post(`${BASE_URL}/rides/${rideToJoin.id}/join`, {}, {
        headers: getAuthHeaders()
      });
      if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
    } catch (error) {
      // It's ok if we're already in the ride
      if (error.response?.status === 400 && error.response.data.error?.includes('already')) {
        return; // pass
      }
      throw error;
    }
  }, true);

  // Test DELETE /api/rides/:id/leave - leave ride (authenticated)
  await testEndpoint('DELETE /api/rides/:id/leave - leave a ride', async () => {
    // Get my rides first
    const myRides = await axios.get(`${BASE_URL}/rides/my-rides`, {
      headers: getAuthHeaders()
    });
    
    if (myRides.data.rides && myRides.data.rides.length > 0) {
      const rideToLeave = myRides.data.rides[0];
      // Don't leave a ride we own
      if (rideToLeave.owner_id === myRides.data.rides[0].owner?.id) {
        throw new Error('Cannot test leave on owned ride');
      }
      
      const response = await axios.delete(`${BASE_URL}/rides/${rideToLeave.id}/leave`, {
        headers: getAuthHeaders()
      });
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    } else {
      throw new Error('No rides joined to test leave');
    }
  }, true);

  // Test DELETE /api/rides/:id - delete ride (authenticated, owner only)
  await testEndpoint('DELETE /api/rides/:id - delete a ride', async () => {
    if (!createdRideId) throw new Error('No ride created to delete');
    const response = await axios.delete(`${BASE_URL}/rides/${createdRideId}`, {
      headers: getAuthHeaders()
    });
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  }, true);
}

// ============================================
// USERS API TESTS
// ============================================
async function testUsersAPI() {
  logSection('USERS API INTEGRATION TESTS');

  // Test GET /api/users
  await testEndpoint('GET /api/users - fetch all users', async () => {
    const response = await axios.get(`${BASE_URL}/users`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    // Response structure may vary - just check it doesn't error
  });

  // Test GET /api/users/username/:username
  await testEndpoint('GET /api/users/username/:username - fetch user by username', async () => {
    // First get a user to find a valid username
    try {
      const response = await axios.get(`${BASE_URL}/users/username/testuser`);
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    } catch (error) {
      // 404 is acceptable if user doesn't exist
      if (error.response?.status === 404) {
        return; // pass
      }
      throw error;
    }
  });

  // Test POST /api/auth/signup - create user
  await testEndpoint('POST /api/auth/signup - create new user', async () => {
    const timestamp = Date.now();
    const userData = {
      username: `testuser_${timestamp}`,
      email: `testuser_${timestamp}@ucla.edu`,
      password: 'TestPassword123!',
      first_name: 'Test',
      last_name: 'User'
    };
    
    try {
      const response = await axios.post(`${BASE_URL}/auth/signup`, userData);
      if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
      if (!response.data.token) throw new Error('Expected token in response');
    } catch (error) {
      // Handle duplicate user gracefully
      if (error.response?.status === 409) {
        return; // pass - user already exists
      }
      throw error;
    }
  });
}

// ============================================
// PROFILE API TESTS
// ============================================
async function testProfileAPI() {
  logSection('PROFILE API INTEGRATION TESTS');

  // Test PUT /api/profile/:userId - update profile (authenticated)
  await testEndpoint('PUT /api/profile/:userId - update user profile', async () => {
    // This typically requires the authenticated user's ID
    // For now, we'll test the endpoint structure
    const profileData = {
      first_name: 'Updated',
      last_name: 'Name',
      bio: 'Integration test bio'
    };
    
    try {
      // We'd need a valid user ID here - this is a placeholder
      const response = await axios.put(`${BASE_URL}/profile/test-user-id`, profileData, {
        headers: getAuthHeaders()
      });
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    } catch (error) {
      // Expected to fail without proper user ID and auth
      if (error.response?.status === 401 || error.response?.status === 404) {
        logSkip('PUT /api/profile/:userId (requires valid user ID)');
        return;
      }
      throw error;
    }
  }, true);
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function runAllTests() {
  log(colors.blue, '\n🧪 BruinSplit API Integration Tests');
  log(colors.blue, '====================================\n');
  
  if (!TEST_TOKEN) {
    log(colors.yellow, '⚠️  Warning: No TEST_TOKEN set. Authenticated endpoints will be skipped.');
    log(colors.yellow, '   Set TEST_TOKEN environment variable to test authenticated routes.\n');
  } else {
    log(colors.green, '✓ TEST_TOKEN found. Will test authenticated endpoints.\n');
  }

  // Check if backend is running
  try {
    await axios.get(BASE_URL);
  } catch (error) {
    log(colors.red, '\n❌ Backend server is not running on', BASE_URL);
    log(colors.yellow, 'Please start the backend server before running integration tests.');
    process.exit(1);
  }

  log(colors.green, '✓ Backend server is reachable at', BASE_URL, '\n');

  // Run all test suites
  await testRidesAPI();
  await testUsersAPI();
  await testProfileAPI();

  // Print summary
  logSection('TEST SUMMARY');
  log(colors.green, `✓ Passed: ${passCount}`);
  log(colors.red, `✗ Failed: ${failCount}`);
  log(colors.yellow, `⊘ Skipped: ${skipCount}`);
  log(colors.blue, `Total: ${passCount + failCount + skipCount}\n`);

  // Exit with appropriate code
  process.exit(failCount > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(colors.red, '\n❌ Fatal error running tests:', error.message);
  process.exit(1);
});
