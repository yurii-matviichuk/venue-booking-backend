import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  app,
  createSlot,
  createVenue,
  getBooked,
  registerOwner,
  registerUser,
  resetDb,
} from './helpers.js';

let venueId: string;

beforeEach(async () => {
  await resetDb();
  venueId = await createVenue();
});

describe('POST /api/bookings', () => {
  it('requires login', async () => {
    const slotId = await createSlot(venueId);

    const res = await request(app).post('/api/bookings').send({ venueId, slotId });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('books a slot as the logged-in user and takes a spot', async () => {
    const slotId = await createSlot(venueId, { capacity: 4 });
    const { agent, user } = await registerUser();

    const res = await agent.post('/api/bookings').send({ venueId, slotId });

    expect(res.status).toBe(201);
    expect(res.body.booking).toMatchObject({
      venueId,
      slotId,
      status: 'pending',
      price: 30,
      customerName: user.name,
      customerEmail: user.email,
    });
    expect(await getBooked(slotId)).toBe(1);

    const availability = await request(app).get(`/api/availability/${venueId}`);
    expect(availability.body[0]).toMatchObject({ available: true, spotsRemaining: 3 });
  });

  it('ignores a customer name or email sent in the request body', async () => {
    const slotId = await createSlot(venueId);
    const { agent, user } = await registerUser();

    const res = await agent
      .post('/api/bookings')
      .send({ venueId, slotId, customerName: 'Someone Else', customerEmail: 'x@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.booking.customerEmail).toBe(user.email);
  });

  it('rejects a full slot', async () => {
    const slotId = await createSlot(venueId, { capacity: 1 });
    const first = await registerUser();
    const second = await registerUser();

    expect((await first.agent.post('/api/bookings').send({ venueId, slotId })).status).toBe(201);
    const res = await second.agent.post('/api/bookings').send({ venueId, slotId });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SLOT_FULLY_BOOKED');
    expect(await getBooked(slotId)).toBe(1);
  });

  it('never overbooks when many people book the last spot at once', async () => {
    const slotId = await createSlot(venueId, { capacity: 1 });
    const users = await Promise.all(Array.from({ length: 8 }, () => registerUser()));

    const results = await Promise.all(
      users.map(({ agent }) => agent.post('/api/bookings').send({ venueId, slotId })),
    );

    const statuses = results.map((res) => res.status);
    expect(statuses.filter((status) => status === 201)).toHaveLength(1);
    expect(statuses.filter((status) => status === 409)).toHaveLength(7);
    expect(await getBooked(slotId)).toBe(1);
  });

  it('rejects a slot that has already started', async () => {
    const slotId = await createSlot(venueId, { hoursFromNow: -1 });
    const { agent } = await registerUser();

    const res = await agent.post('/api/bookings').send({ venueId, slotId });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('SLOT_ALREADY_STARTED');
  });

  it('returns 404 for a slot that does not exist, or belongs to another venue', async () => {
    const otherVenueId = await createVenue();
    const slotId = await createSlot(otherVenueId);
    const { agent } = await registerUser();

    const missing = await agent
      .post('/api/bookings')
      .send({ venueId, slotId: '00000000-0000-4000-8000-000000000000' });
    const wrongVenue = await agent.post('/api/bookings').send({ venueId, slotId });

    expect(missing.status).toBe(404);
    expect(missing.body.code).toBe('SLOT_NOT_FOUND');
    expect(wrongVenue.status).toBe(404);
    expect(await getBooked(slotId)).toBe(0);
  });

  it('rejects ids that are not UUIDs', async () => {
    const { agent } = await registerUser();

    const res = await agent.post('/api/bookings').send({ venueId: 'abc', slotId: '123' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });
});

describe('booking several spots', () => {
  it('takes all the requested spots and defaults to one', async () => {
    const slotId = await createSlot(venueId, { capacity: 6 });
    const { agent } = await registerUser();

    const group = await agent.post('/api/bookings').send({ venueId, slotId, spots: 3 });
    const single = await agent.post('/api/bookings').send({ venueId, slotId });

    expect(group.status).toBe(201);
    expect(group.body.booking).toMatchObject({ spots: 3, price: 30 });
    expect(single.body.booking.spots).toBe(1);
    expect(await getBooked(slotId)).toBe(4);

    const availability = await request(app).get(`/api/availability/${venueId}`);
    expect(availability.body[0]).toMatchObject({ available: true, spotsRemaining: 2 });
  });

  it('can take exactly the last spots', async () => {
    const slotId = await createSlot(venueId, { capacity: 4 });
    const { agent } = await registerUser();

    const res = await agent.post('/api/bookings').send({ venueId, slotId, spots: 4 });

    expect(res.status).toBe(201);
    expect((await request(app).get(`/api/availability/${venueId}`)).body[0].available).toBe(false);
  });

  it('rejects asking for more spots than are left, and takes none', async () => {
    const slotId = await createSlot(venueId, { capacity: 4 });
    const { agent } = await registerUser();
    await agent.post('/api/bookings').send({ venueId, slotId, spots: 3 });

    const res = await agent.post('/api/bookings').send({ venueId, slotId, spots: 2 });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('NOT_ENOUGH_SPOTS');
    expect(await getBooked(slotId)).toBe(3);
  });

  it('still reports a full slot as fully booked', async () => {
    const slotId = await createSlot(venueId, { capacity: 2 });
    const { agent } = await registerUser();
    await agent.post('/api/bookings').send({ venueId, slotId, spots: 2 });

    const res = await agent.post('/api/bookings').send({ venueId, slotId, spots: 1 });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SLOT_FULLY_BOOKED');
  });

  it('never overbooks when groups book at once', async () => {
    const slotId = await createSlot(venueId, { capacity: 4 });
    const users = await Promise.all(Array.from({ length: 8 }, () => registerUser()));

    const results = await Promise.all(
      users.map(({ agent }) => agent.post('/api/bookings').send({ venueId, slotId, spots: 2 })),
    );

    expect(results.filter((res) => res.status === 201)).toHaveLength(2);
    expect(results.filter((res) => res.status === 409)).toHaveLength(6);
    expect(await getBooked(slotId)).toBe(4);
  });

  it.each([0, -1, 1.5, '2', null])('rejects spots = %s', async (spots) => {
    const slotId = await createSlot(venueId);
    const { agent } = await registerUser();

    const res = await agent.post('/api/bookings').send({ venueId, slotId, spots });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(await getBooked(slotId)).toBe(0);
  });

  it('takes more than 10 spots when the slot has room', async () => {
    const slotId = await createSlot(venueId, { capacity: 12 });
    const { agent } = await registerUser();

    const res = await agent.post('/api/bookings').send({ venueId, slotId, spots: 12 });

    expect(res.status).toBe(201);
    expect(await getBooked(slotId)).toBe(12);
  });

  it('refuses more spots than the slot has left', async () => {
    const slotId = await createSlot(venueId, { capacity: 4 });
    const { agent } = await registerUser();

    const res = await agent.post('/api/bookings').send({ venueId, slotId, spots: 5 });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('NOT_ENOUGH_SPOTS');
    expect(await getBooked(slotId)).toBe(0);
  });

  it('gives back all the spots when the booking is cancelled', async () => {
    const slotId = await createSlot(venueId, { capacity: 6 });
    const { agent } = await registerUser();
    const booking = await agent.post('/api/bookings').send({ venueId, slotId, spots: 4 });

    const res = await agent
      .put(`/api/bookings/${booking.body.booking.id}`)
      .send({ status: 'cancelled' });

    expect(res.status).toBe(200);
    expect(res.body.booking.spots).toBe(4);
    expect(await getBooked(slotId)).toBe(0);
  });

  it('shows the number of spots in the booking lists', async () => {
    const owner = await registerOwner();
    const ownedVenueId = await createVenue(owner.user.id);
    const slotId = await createSlot(ownedVenueId);
    const customer = await registerUser();
    await customer.agent.post('/api/bookings').send({ venueId: ownedVenueId, slotId, spots: 3 });

    const mine = await customer.agent.get('/api/bookings');
    const theirs = await owner.agent.get('/api/owner/bookings');

    expect(mine.body.bookings[0].spots).toBe(3);
    expect(theirs.body.bookings[0].spots).toBe(3);
  });
});

describe('GET /api/bookings', () => {
  it('lists only the logged-in user’s bookings', async () => {
    const slotId = await createSlot(venueId);
    const alice = await registerUser();
    const bob = await registerUser();
    await alice.agent.post('/api/bookings').send({ venueId, slotId });
    await bob.agent.post('/api/bookings').send({ venueId, slotId });

    const res = await alice.agent.get('/api/bookings');

    expect(res.status).toBe(200);
    expect(res.body.bookings).toHaveLength(1);
    expect(res.body.bookings[0]).toMatchObject({
      customerEmail: alice.user.email,
      venueName: 'Test Venue',
      venueTimezone: 'UTC',
    });
  });
});

describe('PUT /api/bookings/:id', () => {
  const bookSlot = async (capacity = 4) => {
    const slotId = await createSlot(venueId, { capacity });
    const owner = await registerUser();
    const res = await owner.agent.post('/api/bookings').send({ venueId, slotId });
    return { slotId, owner, bookingId: res.body.booking.id as string };
  };

  it('lets a customer cancel their own booking and frees the spot', async () => {
    const { slotId, owner, bookingId } = await bookSlot();
    expect(await getBooked(slotId)).toBe(1);

    const res = await owner.agent.put(`/api/bookings/${bookingId}`).send({ status: 'cancelled' });

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('cancelled');
    expect(await getBooked(slotId)).toBe(0);
  });

  it('does not let a booking be cancelled twice or free the spot twice', async () => {
    const { slotId, owner, bookingId } = await bookSlot();
    await owner.agent.put(`/api/bookings/${bookingId}`).send({ status: 'cancelled' });

    const again = await owner.agent.put(`/api/bookings/${bookingId}`).send({ status: 'cancelled' });

    expect(again.status).toBe(400);
    expect(again.body.code).toBe('INVALID_STATUS_CHANGE');
    expect(await getBooked(slotId)).toBe(0);
  });

  it('makes a cancelled booking final, even for the venue owner', async () => {
    const venueOwner = await registerOwner();
    const ownedVenueId = await createVenue(venueOwner.user.id);
    const slotId = await createSlot(ownedVenueId);
    const customer = await registerUser();
    const booked = await customer.agent
      .post('/api/bookings')
      .send({ venueId: ownedVenueId, slotId });
    const bookingId = booked.body.booking.id as string;
    await customer.agent.put(`/api/bookings/${bookingId}`).send({ status: 'cancelled' });

    const res = await venueOwner.agent
      .put(`/api/bookings/${bookingId}`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_STATUS_CHANGE');
  });

  it('hides other people’s bookings behind a 404', async () => {
    const { slotId, bookingId } = await bookSlot();
    const stranger = await registerUser();

    const res = await stranger.agent
      .put(`/api/bookings/${bookingId}`)
      .send({ status: 'cancelled' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('BOOKING_NOT_FOUND');
    expect(await getBooked(slotId)).toBe(1);
  });

  it('does not let a customer confirm their own booking', async () => {
    const { owner, bookingId } = await bookSlot();

    const res = await owner.agent.put(`/api/bookings/${bookingId}`).send({ status: 'confirmed' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('returns 404 for a malformed booking id', async () => {
    const { agent } = await registerUser();

    const res = await agent.put('/api/bookings/not-a-uuid').send({ status: 'cancelled' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('BOOKING_NOT_FOUND');
  });

  it('rejects an unknown status', async () => {
    const { owner, bookingId } = await bookSlot();

    const res = await owner.agent.put(`/api/bookings/${bookingId}`).send({ status: 'banana' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });
});
