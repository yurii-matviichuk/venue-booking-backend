import { type Request, type Response } from 'express';
import type { AvailabilitySlot } from '../types/models';
import * as availabilityService from '../services/availability';

export const getByVenue = (req: Request, res: Response<AvailabilitySlot[] | { error: string }>) => {
  const { venueId } = req.params as { venueId: string };
  const availability = availabilityService.getAvailabilityByVenue(venueId);

  if ('error' in availability) {
    return res.status(404).json(availability);
  }

  return res.json(availability);
};
