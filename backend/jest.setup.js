import { jest } from '@jest/globals';

// Make jest available globally for ESM
globalThis.jest = jest;

// Set up environment variables for testing
process.env.JWT_SECRET = 'test-secret-key-for-jest-testing-12345';
process.env.JWT_EXPIRES_IN = '7d';
