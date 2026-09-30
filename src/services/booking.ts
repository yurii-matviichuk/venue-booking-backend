import type { Booking } from '../types/models';
import { CreateBookingInput } from '../validation/schemas';
import { timeSlots } from '../data/mockData';

const bookings: Booking[] = []; // In-memory storage (mock)

export const createBooking = (
  data: CreateBookingInput,
): { booking: Booking } | { error: string } => {
  const { venueId, slotId, customerName, customerEmail } = data;
  const slot = timeSlots.find((s) => s.id === slotId);

  if (!slot) {
    return { error: 'Slot not found' };
  }

  if (slot.booked >= slot.capacity) {
    return { error: 'Slot is fully booked' };
  }

  const booking: Booking = {
    id: `booking-${Date.now()}`,
    venueId,
    slotId,
    customerName,
    customerEmail,
    status: 'pending',
    price: slot.price,
    createdAt: new Date().toISOString(),
  };

  bookings.push(booking);

  return { booking };
};

export const updateBookingStatus = (
  bookingId: string,
  status: Booking['status'],
): { booking: Booking } | { error: string } => {
  const validStatuses: Booking['status'][] = ['pending', 'confirmed', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return {
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    };
  }

  const booking = bookings.find((b) => b.id === bookingId);

  if (!booking) {
    return { error: 'Booking not found' };
  }

  booking.status = status;
  booking.updatedAt = new Date().toISOString();

  return { booking };
};
