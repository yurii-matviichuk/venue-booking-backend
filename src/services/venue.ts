import type { Venue, VenueListItem } from '../types/models.js';
import { query } from '../db/connection.js';
import { isUuid } from '../validation/schemas.js';

const VENUE_COLUMNS =
  'id, name, address, city, timezone, category, description, image_file AS "imageFile"';

// Optional city filter for the home page's city picker. Each venue carries the lowest price per spot
// among its upcoming slots (the same slots the availability endpoint lists), so a card can show "from $X"
type VenueListRow = Omit<VenueListItem, 'minPricePerSpot'> & { minPricePerSpot: string | null };

export const getAllVenues = async (city?: string): Promise<VenueListItem[]> => {
  const listColumns = VENUE_COLUMNS.split(', ')
    .map((column) => `v.${column}`)
    .join(', ');
  const result = await query<VenueListRow>(
    `SELECT ${listColumns}, MIN(s.price) AS "minPricePerSpot"
     FROM venues v
     LEFT JOIN time_slots s ON s.venue_id = v.id AND s.start_time > CURRENT_TIMESTAMP
     ${city ? 'WHERE v.city = $1' : ''}
     GROUP BY v.id
     ORDER BY ${city ? '' : 'v.city, '}v.name, v.id`,
    city ? [city] : [],
  );
  // pg returns DECIMAL as a string
  return result.rows.map((row) => ({
    ...row,
    minPricePerSpot: row.minPricePerSpot === null ? null : Number(row.minPricePerSpot),
  }));
};

export const getVenueById = async (venueId: string): Promise<Venue | null> => {
  // Postgres throws on a malformed UUID, so treat it as "not found" before querying
  if (!isUuid(venueId)) return null;

  const result = await query<Venue>(`SELECT ${VENUE_COLUMNS} FROM venues WHERE id = $1`, [venueId]);
  return result.rows[0] ?? null;
};
