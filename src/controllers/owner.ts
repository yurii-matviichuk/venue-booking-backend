import { type Request, type Response } from 'express';
import type { BookingDetails } from '../types/models.js';
import * as bookingService from '../services/booking.js';
import { AppError } from '../errors.js';

// Mounted behind requireAuth and requireRole('owner'), so req.user is always an owner
export const listBookings = async (req: Request, res: Response<{ bookings: BookingDetails[] }>) => {
  if (!req.user) {
    throw new AppError('UNAUTHORIZED');
  }
  const bookings = await bookingService.listBookingsForOwner(req.user.id);
  return res.json({ bookings });
};
