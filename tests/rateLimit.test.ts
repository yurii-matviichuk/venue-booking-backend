import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from './helpers.js';

// Limits are skipped in tests by default; switch them on for this file only
beforeAll(() => {
  process.env.RATE_LIMIT_IN_TESTS = 'true';
});
afterAll(() => {
  delete process.env.RATE_LIMIT_IN_TESTS;
});

describe('rate limiting', () => {
  it('rejects the 11th login attempt with 429 and the standard error shape', async () => {
    const attempt = () =>
      request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'x' });

    for (let i = 0; i < 10; i++) {
      const res = await attempt();
      expect(res.status).not.toBe(429);
    }

    const limited = await attempt();
    expect(limited.status).toBe(429);
    expect(limited.body.code).toBe('RATE_LIMITED');
    expect(limited.headers['ratelimit-limit']).toBeDefined();
  });

  it('does not limit /health', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).get('/health');
      expect(res.status).not.toBe(429);
    }
  });
});
