import type { AvailabilitySlot } from '../types/models.js';
import { query } from '../db/connection.js';
import { AppError } from '../errors.js';
import { getVenueById } from './venue.js';

type SlotRow = {
  id: string;
  start_time: Date;
  end_time: Date;
  price: string;
  capacity: number;
  booked: number;
};

// Upcoming slots only: slots that have already started can't be booked, so the page doesn't list them
export const getAvailabilityByVenue = async (venueId: string): Promise<AvailabilitySlot[]> => {
  const venue = await getVenueById(venueId);
  if (!venue) {
    throw new AppError('VENUE_NOT_FOUND');
  }

  const result = await query<SlotRow>(
    `SELECT id, start_time, end_time, price, capacity, booked
     FROM time_slots
     WHERE venue_id = $1 AND start_time > CURRENT_TIMESTAMP
     ORDER BY start_time, id`,
    [venueId],
  );

  return result.rows.map((slot) => ({
    id: slot.id,
    time: slot.start_time.toISOString(),
    endTime: slot.end_time.toISOString(),
    // pg returns DECIMAL as a string
    price: Number(slot.price),
    available: slot.booked < slot.capacity,
    spotsRemaining: slot.capacity - slot.booked,
  }));
};
