/**
 * Test data fixtures for E2E tests
 * Uses unique identifiers to avoid conflicts between test runs
 */

/**
 * Generate a unique test user
 * @param {string} prefix - Prefix for the user (e.g., 'owner', 'joiner')
 * @returns {Object} User data object
 */
export function generateTestUser(prefix = 'user') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const uniqueId = `${timestamp}_${random}`;

  return {
    username: `${prefix}_${uniqueId}`,
    email: `${prefix}_${uniqueId}@test.ucla.edu`,
    password: 'TestPassword123!',
    firstName: `Test${prefix.charAt(0).toUpperCase() + prefix.slice(1)}`,
    lastName: `User${random}`
  };
}

/**
 * Generate test ride data
 * @param {Object} options - Override default ride properties
 * @returns {Object} Ride data object
 */
export function generateTestRide(options = {}) {
  const timestamp = Date.now();

  // Generate a future departure time (1 hour from now)
  const departureDate = new Date(Date.now() + 60 * 60 * 1000);
  const formattedDeparture = departureDate.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm

  return {
    origin: options.origin || 'UCLA Hedrick Hall',
    destination: options.destination || `LAX Terminal ${timestamp % 9 + 1}`,
    departure: options.departure || formattedDeparture,
    platform: options.platform || 'LYFT',
    maxSeats: options.maxSeats || 4,
    notes: options.notes || `Test ride created at ${new Date().toISOString()}`
  };
}

/**
 * Common test destinations for search testing
 */
export const TEST_DESTINATIONS = {
  LAX: 'LAX Airport',
  SANTA_MONICA: 'Santa Monica Pier',
  DOWNTOWN: 'Downtown LA',
  ROSE_BOWL: 'Rose Bowl Stadium',
  UNION_STATION: 'Union Station'
};

/**
 * Common test origins
 */
export const TEST_ORIGINS = {
  HEDRICK: 'UCLA Hedrick Hall',
  POWELL: 'Powell Library',
  BRUIN_PLAZA: 'Bruin Plaza',
  SUNSET_VILLAGE: 'Sunset Village'
};

/**
 * Ride platforms
 */
export const PLATFORMS = ['LYFT', 'UBER', 'WAYMO', 'OTHER'];
