import type { Venue } from '../types/models';
import { venues } from '../data/mockData';

export const getAllVenues = (): Venue[] => {
  return venues;
};

export const getVenueById = (venueId: string): Venue | null => {
  return venues.find((v) => v.id === venueId) || null;
};
