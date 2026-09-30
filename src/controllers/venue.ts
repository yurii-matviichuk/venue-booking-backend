import { type Request, type Response } from 'express';
import type { Venue } from '../types/models';
import * as venueService from '../services/venue';

export const getAll = (_req: Request, res: Response<Venue[]>) => {
  const venues = venueService.getAllVenues();
  return res.json(venues);
};

export const getById = (req: Request, res: Response<Venue | { error: string }>) => {
  const { id } = req.params as { id: string };
  const venue = venueService.getVenueById(id);

  if (!venue) {
    return res.status(404).json({ error: 'Venue not found' });
  }

  return res.json(venue);
};
