module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  // Setup file to load environment variables
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverage: false,
  // Handle module path mappings if needed
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
