import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as connection from '../src/db/connection.js';
import { DATABASE_CHECK_TIMEOUT_MS, checkDatabase } from '../src/services/health.js';
import { app } from './helpers.js';

describe('GET /health', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns 200 when the database answers', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns 503 when the database query fails', async () => {
    vi.spyOn(connection, 'query').mockRejectedValue(new Error('connection refused'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body.code).toBe('DATABASE_UNAVAILABLE');
  });

  it('gives up when the database does not answer in time', async () => {
    vi.useFakeTimers();
    vi.spyOn(connection, 'query').mockReturnValue(new Promise(() => {}));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const check = expect(checkDatabase()).rejects.toMatchObject({ code: 'DATABASE_UNAVAILABLE' });
    await vi.advanceTimersByTimeAsync(DATABASE_CHECK_TIMEOUT_MS);

    await check;
  });
});
