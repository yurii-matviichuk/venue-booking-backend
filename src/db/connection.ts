import pkg, { type QueryResultRow } from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const query = <R extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) =>
  pool.query<R>(text, params);

export const getClient = () => pool.connect();

export default pool;
