import { type Request, type Response } from 'express';
import type { Venue } from '../types/models.js';
import { venueQuerySchema } from '../validation/schemas.js';
import * as venueService from '../services/venue.js';
import { AppError } from '../errors.js';

export const getAll = async (req: Request, res: Response<Venue[]>) => {
  const validation = venueQuerySchema.safeParse(req.query);

  if (!validation.success) {
    throw new AppError('VALIDATION_FAILED', validation.error.issues);
  }

  const venues = await venueService.getAllVenues(validation.data.city);
  return res.json(venues);
};

export const getById = async (req: Request, res: Response<Venue>) => {
  const { id } = req.params as { id: string };
  const venue = await venueService.getVenueById(id);

  if (!venue) {
    throw new AppError('VENUE_NOT_FOUND');
  }

  return res.json(venue);
};
