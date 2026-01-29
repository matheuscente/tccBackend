module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['babel-jest', { configFile: './babel.config.cjs' }]
  },
  moduleFileExtensions: ['ts', 'js'],
};