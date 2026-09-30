import { type Request, type Response } from 'express';
import type { Booking } from '../types/models';
import { createBookingSchema, updateBookingStatusSchema } from '../validation/schemas';
import * as bookingService from '../services/booking';

export const create = (
  req: Request<Record<string, never>, never, unknown>,
  res: Response<{ booking: Booking } | { error: string; details?: unknown }>,
) => {
  const validation = createBookingSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.error.issues,
    });
  }

  const result = bookingService.createBooking(validation.data);

  if ('error' in result) {
    const statusCode = result.error.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({ error: result.error });
  }

  return res.status(201).json(result);
};

export const updateStatus = (
  req: Request<{ id: string }, never, unknown>,
  res: Response<{ booking: Booking } | { error: string; details?: unknown }>,
) => {
  const { id } = req.params;

  if (!id?.trim()) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  const validation = updateBookingStatusSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.error.issues,
    });
  }

  const result = bookingService.updateBookingStatus(id, validation.data.status);

  if ('error' in result) {
    const statusCode = result.error.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({ error: result.error });
  }

  return res.json(result);
};
