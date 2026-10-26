import type { Venue } from '../types/models.js';
import { query } from '../db/connection.js';
import { isUuid } from '../validation/schemas.js';

const VENUE_COLUMNS =
  'id, name, location, city, timezone, category, description, image_file AS "imageFile"';

// Optional city filter for the home page's city picker
export const getAllVenues = async (city?: string): Promise<Venue[]> => {
  const result = city
    ? await query<Venue>(`SELECT ${VENUE_COLUMNS} FROM venues WHERE city = $1 ORDER BY name, id`, [
        city,
      ])
    : await query<Venue>(`SELECT ${VENUE_COLUMNS} FROM venues ORDER BY city, name, id`);
  return result.rows;
};

export const getVenueById = async (venueId: string): Promise<Venue | null> => {
  // Postgres throws on a malformed UUID, so treat it as "not found" before querying
  if (!isUuid(venueId)) return null;

  const result = await query<Venue>(`SELECT ${VENUE_COLUMNS} FROM venues WHERE id = $1`, [venueId]);
  return result.rows[0] ?? null;
};
