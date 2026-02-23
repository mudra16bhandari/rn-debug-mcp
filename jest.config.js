module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/packages'],
    testMatch: ['**/__tests__/**/*.{ts,js}', '**/?(*.)+(spec|test).{ts,js}'],
    transform: {
        '^.+\\.(ts|js)$': 'ts-jest',
    },
    moduleNameMapper: {
        '^@rn-debug-mcp/(.*)$': '<rootDir>/packages/$1/src',
    },
    collectCoverageFrom: [
        'packages/*/src/**/*.ts',
        '!packages/*/src/index.ts',
        '!**/node_modules/**',
        '!**/dist/**',
    ],
};
