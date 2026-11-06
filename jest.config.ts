/** @type {import('ts-jest').JestConfigWithTsJest} */
import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', {
      tsconfig: {
        allowJs: true,
        module: 'commonjs',
        jsx: 'react-jsx',
      },
    }],
  },
  verbose: true,
  clearMocks: true,
  collectCoverage: true,
  coverageProvider: 'v8',
};

export default config;
