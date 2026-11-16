import * as authService from '../services/auth.js';

export const SESSION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

// Expired sessions are already rejected on lookup; this only keeps the table from growing forever
const cleanupSessions = () =>
  authService.purgeExpiredSessions().catch((err) => console.error('Session cleanup failed', err));

// Runs once now, then every hour. The timer is unref'd so it never keeps the process alive
export const startSessionCleanup = (): NodeJS.Timeout => {
  void cleanupSessions();
  return setInterval(cleanupSessions, SESSION_CLEANUP_INTERVAL_MS).unref();
};
