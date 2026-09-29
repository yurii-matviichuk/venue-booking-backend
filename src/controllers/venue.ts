import { type Request, type Response } from 'express';
import type { Venue } from '../types/models';
import * as venueService from '../services/venue';

export const getAll = (req: Request, res: Response<Venue[]>) => {
  const venues = venueService.getAllVenues();
  return res.json(venues);
};

export const getById = (req: Request, res: Response<Venue | { error: string }>) => {
  const { venueId } = req.params as { venueId: string };
  const venue = venueService.getVenueById(venueId);

  if (!venue) {
    return res.status(404).json({ error: 'Venue not found' });
  }

  return res.json(venue);
};
