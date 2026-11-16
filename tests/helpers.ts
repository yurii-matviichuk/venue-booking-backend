import request from 'supertest';
import { createApp } from '../src/app.js';
import { query } from '../src/db/connection.js';

export const app = createApp();

// Empties every table so each test starts from nothing
export const resetDb = () =>
  query('TRUNCATE bookings, sessions, time_slots, venues, users RESTART IDENTITY CASCADE');

// A venue always has an owner: pass one, or a new owner is created for it
export const createVenue = async (ownerId?: string): Promise<string> => {
  const owner = ownerId ?? (await insertOwner());
  const result = await query<{ id: string }>(
    `INSERT INTO venues (name, address, city, timezone, category, description, owner_id)
     VALUES ('Test Venue', '1 Test Street', 'Testville', 'UTC', 'Bowling', 'A venue for tests', $1)
     RETURNING id`,
    [owner],
  );
  return result.rows[0].id;
};

// hoursFromNow is negative for a slot that has already started
export const createSlot = async (
  venueId: string,
  {
    capacity = 4,
    hoursFromNow = 24,
    price = 30,
  }: { capacity?: number; hoursFromNow?: number; price?: number } = {},
): Promise<string> => {
  const result = await query<{ id: string }>(
    `INSERT INTO time_slots (venue_id, start_time, end_time, price, capacity)
     VALUES ($1,
             CURRENT_TIMESTAMP + make_interval(hours => $2),
             CURRENT_TIMESTAMP + make_interval(hours => $2 + 1),
             $4, $3)
     RETURNING id`,
    [venueId, hoursFromNow, capacity, price],
  );
  return result.rows[0].id;
};

export const getBooked = async (slotId: string): Promise<number> => {
  const result = await query<{ booked: number }>('SELECT booked FROM time_slots WHERE id = $1', [
    slotId,
  ]);
  return result.rows[0].booked;
};

let counter = 0;

// An owner row without a session, for venues that don't need a logged-in owner
const insertOwner = async (): Promise<string> => {
  counter += 1;
  const result = await query<{ id: string }>(
    `INSERT INTO users (email, name, password_hash, role)
     VALUES ($1, 'Venue Owner', '!', 'owner') RETURNING id`,
    [`venue-owner-${counter}@example.com`],
  );
  return result.rows[0].id;
};

// Registers a new user and returns an agent that keeps their session cookie
export const registerUser = async (overrides: { email?: string; password?: string } = {}) => {
  counter += 1;
  const credentials = {
    name: `Test User ${counter}`,
    email: overrides.email ?? `user${counter}@example.com`,
    password: overrides.password ?? 'test-password',
  };
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send(credentials);
  if (res.status !== 201) throw new Error(`Registering a test user failed: ${res.status}`);
  return { agent, user: res.body.user as { id: string; email: string; name: string }, credentials };
};

export const registerOwner = async () => {
  const result = await registerUser();
  await query("UPDATE users SET role = 'owner' WHERE id = $1", [result.user.id]);
  return result;
};
