import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app, createSlot, createVenue, resetDb } from './helpers.js';
import { query } from '../src/db/connection.js';

beforeEach(resetDb);

// createVenue always makes a venue in 'Testville'; this moves it to the city and name a test needs
const venueIn = async (city: string, name = 'Test Venue'): Promise<string> => {
  const id = await createVenue();
  await query('UPDATE venues SET city = $2, name = $3 WHERE id = $1', [id, city, name]);
  return id;
};

const UNKNOWN_ID = '6f1c2b1e-9d3a-4c5e-8f7a-1b2c3d4e5f60';

describe('GET /api/venues', () => {
  it('lists venues ordered by city, then name', async () => {
    await venueIn('Boston', 'Zeta Hall');
    await venueIn('Austin', 'Alpha Bowl');

    const res = await request(app).get('/api/venues');

    expect(res.status).toBe(200);
    expect(res.body.map((v: { name: string }) => v.name)).toEqual(['Alpha Bowl', 'Zeta Hall']);
  });

  it('returns only the public venue fields', async () => {
    await venueIn('Boston');

    const res = await request(app).get('/api/venues');

    expect(Object.keys(res.body[0]).sort()).toEqual([
      'address',
      'category',
      'city',
      'description',
      'id',
      'imageFile',
      'minPricePerSpot',
      'name',
      'timezone',
    ]);
  });

  it('shows the lowest price among upcoming slots, ignoring started ones', async () => {
    const venueId = await venueIn('Boston');
    await createSlot(venueId, { price: 40, hoursFromNow: 24 });
    await createSlot(venueId, { price: 25.5, hoursFromNow: 48 });
    await createSlot(venueId, { price: 5, hoursFromNow: -1 });

    const res = await request(app).get('/api/venues');

    expect(res.body[0].minPricePerSpot).toBe(25.5);
  });

  it('returns a null price for a venue with no upcoming slots', async () => {
    const venueId = await venueIn('Boston');
    await createSlot(venueId, { hoursFromNow: -1 });
    await venueIn('Boston', 'Empty Hall');

    const res = await request(app).get('/api/venues?city=Boston');

    expect(res.body.map((v: { minPricePerSpot: number | null }) => v.minPricePerSpot)).toEqual([
      null,
      null,
    ]);
  });

  it('prices each venue from its own slots', async () => {
    const a = await venueIn('Boston', 'A Hall');
    const b = await venueIn('Boston', 'B Hall');
    await createSlot(a, { price: 20 });
    await createSlot(b, { price: 35 });

    const res = await request(app).get('/api/venues?city=Boston');

    expect(res.body.map((v: { minPricePerSpot: number }) => v.minPricePerSpot)).toEqual([20, 35]);
  });

  it('filters by city', async () => {
    await venueIn('Boston', 'Harbor Bowl');
    await venueIn('Austin', 'Alpha Bowl');

    const res = await request(app).get('/api/venues?city=Boston');

    expect(res.body.map((v: { name: string }) => v.name)).toEqual(['Harbor Bowl']);
  });

  it('returns an empty list for a city with no venues', async () => {
    await venueIn('Boston');

    const res = await request(app).get('/api/venues?city=Denver');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('rejects an empty city filter', async () => {
    const res = await request(app).get('/api/venues?city=');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });
});

describe('GET /api/venues/:id', () => {
  it('returns the venue', async () => {
    const id = await venueIn('Boston', 'Harbor Bowl');

    const res = await request(app).get(`/api/venues/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, name: 'Harbor Bowl', city: 'Boston' });
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get(`/api/venues/${UNKNOWN_ID}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('VENUE_NOT_FOUND');
  });

  it('treats a malformed id as not found, not as a server error', async () => {
    const res = await request(app).get('/api/venues/not-a-uuid');

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('VENUE_NOT_FOUND');
  });
});

describe('GET /api/cities', () => {
  it('lists each city once, sorted', async () => {
    await venueIn('Boston');
    await venueIn('Boston');
    await venueIn('Austin');

    const res = await request(app).get('/api/cities');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(['Austin', 'Boston']);
  });

  it('returns an empty list when there are no venues', async () => {
    const res = await request(app).get('/api/cities');

    expect(res.body).toEqual([]);
  });
});

describe('GET /api/availability/:venueId', () => {
  it('lists upcoming slots with a numeric price and remaining spots', async () => {
    const venueId = await venueIn('Boston');
    const slotId = await createSlot(venueId, { capacity: 4, hoursFromNow: 24 });
    await query('UPDATE time_slots SET booked = 3 WHERE id = $1', [slotId]);

    const res = await request(app).get(`/api/availability/${venueId}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      expect.objectContaining({
        id: slotId,
        price: 30,
        available: true,
        spotsRemaining: 1,
      }),
    ]);
  });

  it('marks a full slot as unavailable', async () => {
    const venueId = await venueIn('Boston');
    const slotId = await createSlot(venueId, { capacity: 2, hoursFromNow: 24 });
    await query('UPDATE time_slots SET booked = 2 WHERE id = $1', [slotId]);

    const res = await request(app).get(`/api/availability/${venueId}`);

    expect(res.body[0]).toMatchObject({ available: false, spotsRemaining: 0 });
  });

  it('hides slots that have already started', async () => {
    const venueId = await venueIn('Boston');
    await createSlot(venueId, { hoursFromNow: -1 });
    const upcoming = await createSlot(venueId, { hoursFromNow: 24 });

    const res = await request(app).get(`/api/availability/${venueId}`);

    expect(res.body.map((s: { id: string }) => s.id)).toEqual([upcoming]);
  });

  it('orders slots by start time', async () => {
    const venueId = await venueIn('Boston');
    const later = await createSlot(venueId, { hoursFromNow: 48 });
    const sooner = await createSlot(venueId, { hoursFromNow: 24 });

    const res = await request(app).get(`/api/availability/${venueId}`);

    expect(res.body.map((s: { id: string }) => s.id)).toEqual([sooner, later]);
  });

  it('returns 404 for an unknown or malformed venue id', async () => {
    const unknown = await request(app).get(`/api/availability/${UNKNOWN_ID}`);
    const malformed = await request(app).get('/api/availability/not-a-uuid');

    expect(unknown.status).toBe(404);
    expect(unknown.body.code).toBe('VENUE_NOT_FOUND');
    expect(malformed.status).toBe(404);
    expect(malformed.body.code).toBe('VENUE_NOT_FOUND');
  });
});
