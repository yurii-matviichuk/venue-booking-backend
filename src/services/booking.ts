import type { PoolClient } from 'pg';
import type { Booking, BookingDetails, User } from '../types/models.js';
import type { CreateBookingInput } from '../validation/schemas.js';
import { getClient, query } from '../db/connection.js';
import { AppError } from '../errors.js';
import { isUuid } from '../validation/schemas.js';

type BookingRow = {
  id: string;
  venue_id: string;
  time_slot_id: string;
  customer_name: string;
  customer_email: string;
  status: Booking['status'];
  price: string;
  created_at: Date;
  updated_at: Date;
};

type BookingDetailsRow = BookingRow & {
  venue_name: string;
  venue_location: string;
  start_time: Date;
  end_time: Date;
};

const toBooking = (row: BookingRow): Booking => ({
  id: row.id,
  venueId: row.venue_id,
  slotId: row.time_slot_id,
  customerName: row.customer_name,
  customerEmail: row.customer_email,
  status: row.status,
  // pg returns DECIMAL as a string
  price: Number(row.price),
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

const toBookingDetails = (row: BookingDetailsRow): BookingDetails => ({
  ...toBooking(row),
  venueName: row.venue_name,
  venueLocation: row.venue_location,
  startTime: row.start_time.toISOString(),
  endTime: row.end_time.toISOString(),
});

// Runs fn inside a transaction: commits if it resolves, rolls back if it throws
const withTransaction = async <T>(fn: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Throws AppError when the slot doesn't exist for this venue, has started, or is full
export const createBooking = async (user: User, data: CreateBookingInput): Promise<Booking> => {
  return withTransaction(async (client) => {
    // One conditional UPDATE both checks capacity and takes the spot, so two people
    // booking the last spot at the same time can't both succeed
    const taken = await client.query<{ price: string }>(
      `UPDATE time_slots SET booked = booked + 1
       WHERE id = $1 AND venue_id = $2 AND booked < capacity AND start_time > CURRENT_TIMESTAMP
       RETURNING price`,
      [data.slotId, data.venueId],
    );

    if (taken.rowCount === 0) {
      // Nothing was updated: work out why, so the client gets the right error
      const slot = await client.query<{ full: boolean; started: boolean }>(
        `SELECT booked >= capacity AS full, start_time <= CURRENT_TIMESTAMP AS started
         FROM time_slots WHERE id = $1 AND venue_id = $2`,
        [data.slotId, data.venueId],
      );
      if (!slot.rows[0]) throw new AppError('SLOT_NOT_FOUND');
      if (slot.rows[0].started) throw new AppError('SLOT_ALREADY_STARTED');
      throw new AppError('SLOT_FULLY_BOOKED');
    }

    const inserted = await client.query<BookingRow>(
      `INSERT INTO bookings (time_slot_id, venue_id, user_id, customer_name, customer_email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, venue_id, time_slot_id, customer_name, customer_email, status,
                 $6::numeric AS price, created_at, updated_at`,
      [data.slotId, data.venueId, user.id, user.name, user.email, taken.rows[0].price],
    );
    return toBooking(inserted.rows[0]);
  });
};

// The current user's bookings, soonest slot first
export const listBookingsForUser = async (userId: string): Promise<BookingDetails[]> => {
  const result = await query<BookingDetailsRow>(
    `SELECT b.id, b.venue_id, b.time_slot_id, b.customer_name, b.customer_email, b.status,
            s.price, b.created_at, b.updated_at,
            v.name AS venue_name, v.location AS venue_location, s.start_time, s.end_time
     FROM bookings b
     JOIN time_slots s ON s.id = b.time_slot_id
     JOIN venues v ON v.id = b.venue_id
     WHERE b.user_id = $1
     ORDER BY s.start_time, b.id`,
    [userId],
  );
  return result.rows.map(toBookingDetails);
};

// Customers can only cancel their own bookings; admins can set any status on any booking.
// A cancelled booking is final, and cancelling gives the spot back to the slot.
export const updateBookingStatus = async (
  user: User,
  bookingId: string,
  status: Booking['status'],
): Promise<Booking> => {
  // Postgres throws on a malformed UUID, so treat it as "not found" before querying
  if (!isUuid(bookingId)) throw new AppError('BOOKING_NOT_FOUND');

  return withTransaction(async (client) => {
    // FOR UPDATE locks the row, so two simultaneous cancels can't both give the spot back
    const found = await client.query<BookingRow & { user_id: string }>(
      `SELECT b.id, b.venue_id, b.time_slot_id, b.user_id, b.customer_name, b.customer_email,
              b.status, s.price, b.created_at, b.updated_at
       FROM bookings b
       JOIN time_slots s ON s.id = b.time_slot_id
       WHERE b.id = $1
       FOR UPDATE OF b`,
      [bookingId],
    );
    const booking = found.rows[0];
    const isAdmin = user.role === 'admin';

    // Other people's bookings look the same as missing ones, so ids can't be probed
    if (!booking || (!isAdmin && booking.user_id !== user.id)) {
      throw new AppError('BOOKING_NOT_FOUND');
    }
    if (!isAdmin && status !== 'cancelled') throw new AppError('FORBIDDEN');
    if (booking.status === 'cancelled' || booking.status === status) {
      throw new AppError('INVALID_STATUS_CHANGE');
    }

    if (status === 'cancelled') {
      await client.query('UPDATE time_slots SET booked = booked - 1 WHERE id = $1', [
        booking.time_slot_id,
      ]);
    }

    const updated = await client.query<BookingRow>(
      `UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, venue_id, time_slot_id, customer_name, customer_email, status,
                 $3::numeric AS price, created_at, updated_at`,
      [status, bookingId, booking.price],
    );
    return toBooking(updated.rows[0]);
  });
};
