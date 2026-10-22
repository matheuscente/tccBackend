/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  maxWorkers: 1,

  roots: ['<rootDir>/src'],

  testMatch: ['**/*.test.ts'],

  testPathIgnorePatterns: [
    '/node_modules/',
    '/.prisma/',
    '@prisma',
    '/dist/',
  ],

  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  transform: {
    '^.+\\.ts$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },

  moduleFileExtensions: ['ts', 'js'],

  extensionsToTreatAsEsm: [],
};
