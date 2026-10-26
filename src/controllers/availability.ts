import { type Request, type Response } from 'express';
import type { AvailabilitySlot } from '../types/models.js';
import * as availabilityService from '../services/availability.js';

export const getByVenue = async (req: Request, res: Response<AvailabilitySlot[]>) => {
  const { venueId } = req.params as { venueId: string };
  const availability = await availabilityService.getAvailabilityByVenue(venueId);
  return res.json(availability);
};
