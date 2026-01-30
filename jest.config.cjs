/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',

  // 🔒 Limita onde o Jest procura testes
  roots: ['<rootDir>/src'],

  // 🔎 Só arquivos de teste reais
  testMatch: ['**/*.test.ts'],

  // 🚫 Ignora código gerado e dependências
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

  // 🔕 evita conflitos com ESM
  extensionsToTreatAsEsm: [],
};
