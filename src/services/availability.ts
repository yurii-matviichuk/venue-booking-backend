import type { AvailabilitySlot } from '../types/models';
import { timeSlots, venues } from '../data/mockData';

export const getAvailabilityByVenue = (venueId: string): AvailabilitySlot[] | { error: string } => {
  const venue = venues.find((v) => v.id === venueId);
  if (!venue) {
    return { error: 'Venue not found' };
  }

  const slots = timeSlots.filter((slot) => slot.venueId === venueId);
  const availability: AvailabilitySlot[] = slots.map((slot) => ({
    id: slot.id,
    time: slot.startTime,
    price: slot.price,
    available: slot.booked < slot.capacity,
    spotsRemaining: slot.capacity - slot.booked,
  }));

  return availability;
};
