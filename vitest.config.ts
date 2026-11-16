import { defineConfig } from 'vitest/config';
import { TEST_DATABASE_URL } from './tests/testDatabase.js';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: ['./tests/globalSetup.ts'],
    // DATABASE_URL must point at the test database before src/db/connection.ts loads.
    // dotenv never overrides a variable that is already set, so .env can't redirect the tests.
    env: { DATABASE_URL: TEST_DATABASE_URL, NODE_ENV: 'test' },
    // All test files share one database, so they must not run at the same time
    fileParallelism: false,
  },
});
