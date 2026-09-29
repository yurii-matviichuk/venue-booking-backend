import { type Request, type Response } from 'express';
import type { Booking, UpdateBookingBody } from '../types/models';
import * as bookingService from '../services/booking';

export const create = (
  req: Request<
    Record<string, never>,
    never,
    { venueId: string; slotId: string; customerName: string; customerEmail: string }
  >,
  res: Response<{ booking: Booking } | { error: string }>,
) => {
  const { venueId, slotId, customerName, customerEmail } = req.body;

  if (!venueId || !slotId || !customerName || !customerEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = bookingService.createBooking(venueId, slotId, customerName, customerEmail);

  if ('error' in result) {
    return res.status(400).json(result);
  }

  return res.status(201).json(result);
};

export const updateStatus = (
  req: Request<{ bookingId: string }, never, UpdateBookingBody>,
  res: Response<{ booking: Booking } | { error: string }>,
) => {
  const { bookingId } = req.params;
  const { status } = req.body;

  const result = bookingService.updateBookingStatus(bookingId, status);

  if ('error' in result) {
    return res.status(400).json(result);
  }

  return res.json(result);
};
