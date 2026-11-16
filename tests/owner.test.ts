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
import { query } from '../src/db/connection.js';

beforeEach(resetDb);

// A venue owned by `owner` with one slot, and a pending booking made by a new customer
const setup = async () => {
  const owner = await registerOwner();
  const venueId = await createVenue(owner.user.id);
  const slotId = await createSlot(venueId);
  const customer = await registerUser();
  const res = await customer.agent.post('/api/bookings').send({ venueId, slotId });
  return { owner, customer, venueId, slotId, bookingId: res.body.booking.id as string };
};

describe('owner changing booking status', () => {
  it('can confirm a booking at their own venue', async () => {
    const { owner, bookingId } = await setup();

    const res = await owner.agent.put(`/api/bookings/${bookingId}`).send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('confirmed');
  });

  it('can cancel a booking at their own venue, which frees the spot', async () => {
    const { owner, slotId, bookingId } = await setup();
    expect(await getBooked(slotId)).toBe(1);

    const res = await owner.agent.put(`/api/bookings/${bookingId}`).send({ status: 'cancelled' });

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('cancelled');
    expect(await getBooked(slotId)).toBe(0);
  });

  it('cannot set a booking back to pending', async () => {
    const { owner, bookingId } = await setup();
    await owner.agent.put(`/api/bookings/${bookingId}`).send({ status: 'confirmed' });

    const res = await owner.agent.put(`/api/bookings/${bookingId}`).send({ status: 'pending' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('cannot touch a booking at another owner’s venue', async () => {
    const { bookingId, slotId } = await setup();
    const otherOwner = await registerOwner();

    const res = await otherOwner.agent
      .put(`/api/bookings/${bookingId}`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('BOOKING_NOT_FOUND');
    expect(await getBooked(slotId)).toBe(1);
  });

  it('is treated as a customer for their own bookings at someone else’s venue', async () => {
    const { venueId, slotId } = await setup();
    const owner = await registerOwner();
    const booking = await owner.agent.post('/api/bookings').send({ venueId, slotId });
    const bookingId = booking.body.booking.id;

    const confirm = await owner.agent
      .put(`/api/bookings/${bookingId}`)
      .send({ status: 'confirmed' });
    const cancel = await owner.agent
      .put(`/api/bookings/${bookingId}`)
      .send({ status: 'cancelled' });

    expect(confirm.status).toBe(403);
    expect(cancel.status).toBe(200);
  });

  it('does not give a customer more rights over their own booking', async () => {
    const { customer, bookingId } = await setup();

    const res = await customer.agent
      .put(`/api/bookings/${bookingId}`)
      .send({ status: 'confirmed' });

    expect(res.status).toBe(403);
  });
});

describe('booking whose slot has already started', () => {
  // The API refuses to book a started slot, so move the slot into the past after booking
  const startSlot = (slotId: string) =>
    query(
      "UPDATE time_slots SET start_time = CURRENT_TIMESTAMP - INTERVAL '1 hour', end_time = CURRENT_TIMESTAMP WHERE id = $1",
      [slotId],
    );

  it('cannot be confirmed, even by the owner', async () => {
    const { owner, slotId, bookingId } = await setup();
    await startSlot(slotId);

    const byOwner = await owner.agent
      .put(`/api/bookings/${bookingId}`)
      .send({ status: 'confirmed' });

    expect(byOwner.status).toBe(400);
    expect(byOwner.body.code).toBe('SLOT_ALREADY_STARTED');
  });

  it('can still be cancelled', async () => {
    const { owner, slotId, bookingId } = await setup();
    await startSlot(slotId);

    const res = await owner.agent.put(`/api/bookings/${bookingId}`).send({ status: 'cancelled' });

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('cancelled');
  });
});

describe('GET /api/owner/bookings', () => {
  it('requires login', async () => {
    const res = await request(app).get('/api/owner/bookings');

    expect(res.status).toBe(401);
  });

  it('is forbidden for customers', async () => {
    const customer = await registerUser();

    const res = await customer.agent.get('/api/owner/bookings');

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('lists bookings at the owner’s venues with the customer’s details, and no others', async () => {
    const { owner, customer, venueId } = await setup();
    // A booking at someone else's venue must not show up
    const otherOwner = await registerOwner();
    const otherVenueId = await createVenue(otherOwner.user.id);
    const otherSlotId = await createSlot(otherVenueId);
    await customer.agent.post('/api/bookings').send({ venueId: otherVenueId, slotId: otherSlotId });

    const res = await owner.agent.get('/api/owner/bookings');

    expect(res.status).toBe(200);
    expect(res.body.bookings).toHaveLength(1);
    expect(res.body.bookings[0]).toMatchObject({
      venueId,
      venueName: 'Test Venue',
      venueTimezone: 'UTC',
      status: 'pending',
      customerName: customer.user.name,
      customerEmail: customer.user.email,
    });
  });

  it('puts pending bookings before confirmed ones', async () => {
    const owner = await registerOwner();
    const venueId = await createVenue(owner.user.id);
    const earlySlot = await createSlot(venueId, { hoursFromNow: 2 });
    const lateSlot = await createSlot(venueId, { hoursFromNow: 48 });
    const customer = await registerUser();
    const early = await customer.agent.post('/api/bookings').send({ venueId, slotId: earlySlot });
    await customer.agent.post('/api/bookings').send({ venueId, slotId: lateSlot });
    await owner.agent.put(`/api/bookings/${early.body.booking.id}`).send({ status: 'confirmed' });

    const res = await owner.agent.get('/api/owner/bookings');

    expect(res.body.bookings.map((b: { status: string }) => b.status)).toEqual([
      'pending',
      'confirmed',
    ]);
  });
});
