import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { query } from '../src/db/connection.js';
import { purgeExpiredSessions } from '../src/services/auth.js';
import { app, registerUser, resetDb } from './helpers.js';

beforeEach(resetDb);

describe('POST /api/auth/register', () => {
  it('creates an account, logs in and never returns the password hash', async () => {
    const { agent, user } = await registerUser({ email: 'Jane@Example.com' });

    expect(user.email).toBe('jane@example.com');
    expect(user).not.toHaveProperty('password_hash');
    expect(user).not.toHaveProperty('passwordHash');

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.id).toBe(user.id);
  });

  it('sets an httpOnly session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jane', email: 'jane@example.com', password: 'test-password' });

    expect(res.status).toBe(201);
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
  });

  it('rejects an email that is already registered, ignoring case', async () => {
    await registerUser({ email: 'jane@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other Jane', email: 'JANE@example.com', password: 'test-password' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
  });

  it('rejects a password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jane', email: 'jane@example.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('rejects a password longer than 72 bytes', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jane', email: 'jane@example.com', password: 'a'.repeat(73) });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('rejects a malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{ not json');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_JSON');
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the right credentials', async () => {
    const { credentials } = await registerUser();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('gives the same error for a wrong password and an unknown email', async () => {
    const { credentials } = await registerUser();

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'test-password' });

    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body.code).toBe('INVALID_CREDENTIALS');
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });
});

describe('sessions', () => {
  it('requires login for /me', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('ends the session on logout, even if the old cookie is replayed', async () => {
    const { agent, credentials } = await registerUser();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });
    const cookie = login.headers['set-cookie'][0].split(';')[0];

    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(200);

    await request(app).post('/api/auth/logout').set('Cookie', cookie);

    // The server deleted the session, so the copied cookie no longer works
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(401);
    // A different session of the same user is not affected
    expect((await agent.get('/api/auth/me')).status).toBe(200);
  });
});

describe('purgeExpiredSessions', () => {
  it('deletes only expired sessions', async () => {
    // Registering creates one valid session
    const { agent, user } = await registerUser();
    await query(
      `INSERT INTO sessions (token_hash, user_id, expires_at)
       VALUES (repeat('a', 64), $1, CURRENT_TIMESTAMP - interval '1 minute')`,
      [user.id],
    );

    expect(await purgeExpiredSessions()).toBe(1);

    const remaining = await query('SELECT token_hash FROM sessions');
    expect(remaining.rowCount).toBe(1);
    expect((await agent.get('/api/auth/me')).status).toBe(200);
  });
});
