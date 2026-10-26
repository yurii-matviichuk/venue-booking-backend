import { type Request, type Response } from 'express';
import type { Booking, BookingDetails } from '../types/models.js';
import { createBookingSchema, updateBookingStatusSchema } from '../validation/schemas.js';
import * as bookingService from '../services/booking.js';
import { AppError } from '../errors.js';

// These handlers are mounted behind requireAuth, so req.user is always set
const currentUser = (req: Request) => {
  if (!req.user) {
    throw new AppError('UNAUTHORIZED');
  }
  return req.user;
};

export const list = async (req: Request, res: Response<{ bookings: BookingDetails[] }>) => {
  const bookings = await bookingService.listBookingsForUser(currentUser(req).id);
  return res.json({ bookings });
};

export const create = async (req: Request, res: Response<{ booking: Booking }>) => {
  const validation = createBookingSchema.safeParse(req.body);

  if (!validation.success) {
    throw new AppError('VALIDATION_FAILED', validation.error.issues);
  }

  const booking = await bookingService.createBooking(currentUser(req), validation.data);
  return res.status(201).json({ booking });
};

export const updateStatus = async (
  req: Request<{ id: string }>,
  res: Response<{ booking: Booking }>,
) => {
  const validation = updateBookingStatusSchema.safeParse(req.body);

  if (!validation.success) {
    throw new AppError('VALIDATION_FAILED', validation.error.issues);
  }

  const booking = await bookingService.updateBookingStatus(
    currentUser(req),
    req.params.id,
    validation.data.status,
  );
  return res.json({ booking });
};
