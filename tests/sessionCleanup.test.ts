import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_CLEANUP_INTERVAL_MS, startSessionCleanup } from '../src/jobs/sessionCleanup.js';
import * as authService from '../src/services/auth.js';

describe('startSessionCleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('purges at startup and then on every interval', () => {
    const purge = vi.spyOn(authService, 'purgeExpiredSessions').mockResolvedValue(0);
    const timer = startSessionCleanup();

    expect(purge).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(SESSION_CLEANUP_INTERVAL_MS * 2);
    expect(purge).toHaveBeenCalledTimes(3);

    clearInterval(timer);
  });

  it('logs a failure and keeps running', async () => {
    const purge = vi
      .spyOn(authService, 'purgeExpiredSessions')
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValue(0);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const timer = startSessionCleanup();

    await vi.advanceTimersByTimeAsync(SESSION_CLEANUP_INTERVAL_MS);

    expect(log).toHaveBeenCalledWith('Session cleanup failed', expect.any(Error));
    expect(purge).toHaveBeenCalledTimes(2);

    clearInterval(timer);
  });
});
