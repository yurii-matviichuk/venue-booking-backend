import { query } from '../db/connection.js';

// Distinct cities that have at least one venue, for the city picker
export const getAllCities = async (): Promise<string[]> => {
  const { rows } = await query<{ city: string }>('SELECT DISTINCT city FROM venues ORDER BY city');
  return rows.map((row) => row.city);
};
