// In vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'], // Path to your setup file
    globals: true, // Allows using describe, test, expect without explicit imports
  },
});