import { query } from '../db/connection.js';

const DEMO_SLOT_DAYS = 28;

// Demo data only: keeps the next `days` days stocked with slots for every venue, so a demo database
// that was seeded once doesn't run out of bookable slots. Returns how many slots were added.
// Same rules as the generating INSERT at the bottom of src/db/seed.sql (keep the two in sync):
// each venue repeats the duration, price and capacity of its existing slots (20% weekend uplift),
// starting at 10:00 local time and ending by 21:00. Some days and slots are left out on purpose, so
// the calendar has disabled days. The choice is a hash of venue and day, so a re-run picks the same
// ones. Safe to run again: a slot is never added where one already overlaps, and nothing is deleted.
export const topUpDemoSlots = async (days: number = DEMO_SLOT_DAYS): Promise<number> => {
  const result = await query(
    `INSERT INTO time_slots (venue_id, start_time, end_time, price, capacity, booked)
     SELECT v.id,
            (day.d + slot.start_offset) AT TIME ZONE v.timezone,
            (day.d + slot.start_offset + s.duration) AT TIME ZONE v.timezone,
            CASE WHEN EXTRACT(DOW FROM day.d) IN (0, 6) THEN ROUND(s.base_price * 1.2) ELSE s.base_price END,
            s.capacity,
            0
     FROM venues AS v
     CROSS JOIN generate_series(1, $1::int) AS g(n)
     CROSS JOIN LATERAL (SELECT CURRENT_DATE + g.n AS d) AS day
     JOIN LATERAL (
       SELECT COALESCE(MIN(price), 25) AS base_price,
              COALESCE(MAX(capacity), 6) AS capacity,
              COALESCE(MODE() WITHIN GROUP (ORDER BY end_time - start_time), INTERVAL '1 hour') AS duration
       FROM time_slots
       WHERE venue_id = v.id
     ) AS s ON TRUE
     CROSS JOIN generate_series(0, 10) AS k(i)
     CROSS JOIN LATERAL (SELECT INTERVAL '10 hours' + k.i * (s.duration + INTERVAL '2 hours') AS start_offset) AS slot
     WHERE slot.start_offset + s.duration <= INTERVAL '21 hours'
       AND abs(hashtext(v.id::text || day.d::text)) % 4 <> 0
       AND abs(hashtext(v.id::text || day.d::text || k.i::text)) % 3 <> 0
       AND NOT EXISTS (
         SELECT 1 FROM time_slots AS t
         WHERE t.venue_id = v.id
           AND t.start_time < (day.d + slot.start_offset + s.duration) AT TIME ZONE v.timezone
           AND t.end_time > (day.d + slot.start_offset) AT TIME ZONE v.timezone
       )`,
    [days],
  );
  return result.rowCount ?? 0;
};
