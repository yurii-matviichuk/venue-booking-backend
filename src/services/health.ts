import { query } from '../db/connection.js';
import { AppError } from '../errors.js';

export const DATABASE_CHECK_TIMEOUT_MS = 3000;

// Throws DATABASE_UNAVAILABLE if the database doesn't answer a trivial query in time,
// so a health check never hangs on a database that is down or unreachable
export const checkDatabase = async (): Promise<void> => {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error('Database check timed out')),
      DATABASE_CHECK_TIMEOUT_MS,
    );
  });

  try {
    await Promise.race([query('SELECT 1'), timeout]);
  } catch (err) {
    console.error('Health check failed', err);
    throw new AppError('DATABASE_UNAVAILABLE');
  } finally {
    clearTimeout(timer);
  }
};
