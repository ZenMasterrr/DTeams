// Test configuration for the backend
export const TEST_CONFIG = {
  // Use a separate test database
  DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/zapier_test',
  
  // Test user credentials
  TEST_USER: {
    email: 'test@example.com',
    address: '0x1234567890123456789012345678901234567890',
  },

  // API base URL
  API_BASE_URL: 'http://localhost:3002/api',

  // Test timeouts
  TIMEOUT: 30000, // 30 seconds
};
