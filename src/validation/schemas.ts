import { z } from 'zod';

export const createBookingSchema = z.object({
  venueId: z.string().min(1, 'Venue ID is required'),
  slotId: z.string().min(1, 'Slot ID is required'),
  customerName: z.string().min(3, 'Customer name must be at least 3 characters'),
  customerEmail: z.email('Invalid email address'),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled']),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
