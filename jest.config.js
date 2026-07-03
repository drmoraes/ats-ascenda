/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    // ts-jest herda isolatedModules do tsconfig: transpila sem type-check
    // completo, evitando dependência do Prisma Client gerado nos testes.
    '^.+\\.ts$': ['ts-jest', {}],
  },
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
};
