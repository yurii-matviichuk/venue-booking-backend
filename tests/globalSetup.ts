import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { TEST_DATABASE_URL } from './testDatabase.js';

// Runs once before all tests: creates the test database if needed and rebuilds its tables
// from src/db/schema.sql, so every run starts from the current schema.
export default async function setup() {
  const url = new URL(TEST_DATABASE_URL);
  const dbName = url.pathname.slice(1);

  // Safety: the schema is dropped below, so refuse to touch anything that isn't a test database
  if (!dbName.endsWith('_test')) {
    throw new Error(`Refusing to run tests: database "${dbName}" does not end with "_test"`);
  }

  // CREATE DATABASE has to run from a different database, so connect to the default one
  const adminUrl = new URL(TEST_DATABASE_URL);
  adminUrl.pathname = '/postgres';
  const admin = new pg.Client({ connectionString: adminUrl.toString() });
  try {
    await admin.connect();
  } catch (err) {
    throw new Error(
      'Cannot reach PostgreSQL for the tests. Start it with "docker compose up -d".',
      {
        cause: err,
      },
    );
  }
  try {
    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await admin.end();
  }

  const client = new pg.Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();
  try {
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    const schema = readFileSync(
      fileURLToPath(new URL('../src/db/schema.sql', import.meta.url)),
      'utf8',
    );
    await client.query(schema);
  } finally {
    await client.end();
  }
}
