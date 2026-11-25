import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { query } from '../src/db/connection.js';
import {
  DEMO_SLOT_REFRESH_INTERVAL_MS,
  startDemoSlotRefresh,
} from '../src/jobs/demoSlotRefresh.js';
import * as demoSlotService from '../src/services/demoSlots.js';
import { createSlot, createVenue, resetDb } from './helpers.js';

describe('topUpDemoSlots', () => {
  beforeEach(resetDb);

  const countSlots = async (venueId: string) => {
    const result = await query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM time_slots WHERE venue_id = $1',
      [venueId],
    );
    return Number(result.rows[0].count);
  };

  it('adds upcoming slots that copy the venue price and capacity', async () => {
    const venueId = await createVenue();
    await createSlot(venueId, { capacity: 8, price: 20 });

    const added = await demoSlotService.topUpDemoSlots(14);

    expect(added).toBeGreaterThan(0);
    const result = await query<{ capacity: number; price: string; booked: number }>(
      `SELECT capacity, price, booked FROM time_slots
       WHERE venue_id = $1 AND start_time > CURRENT_TIMESTAMP + INTERVAL '2 days'`,
      [venueId],
    );
    expect(result.rows.length).toBeGreaterThan(0);
    for (const slot of result.rows) {
      expect(slot.capacity).toBe(8);
      expect([20, 24]).toContain(Number(slot.price));
      expect(slot.booked).toBe(0);
    }
  });

  it('adds nothing the second time and never overlaps slots', async () => {
    const venueId = await createVenue();
    await createSlot(venueId);
    await demoSlotService.topUpDemoSlots(14);
    const after = await countSlots(venueId);

    expect(await demoSlotService.topUpDemoSlots(14)).toBe(0);
    expect(await countSlots(venueId)).toBe(after);

    const overlaps = await query(
      `SELECT 1 FROM time_slots a JOIN time_slots b
         ON a.venue_id = b.venue_id AND a.id < b.id
        AND a.start_time < b.end_time AND a.end_time > b.start_time
       WHERE a.venue_id = $1`,
      [venueId],
    );
    expect(overlaps.rowCount).toBe(0);
  });

  it('keeps existing slots and bookings untouched', async () => {
    const venueId = await createVenue();
    const slotId = await createSlot(venueId, { capacity: 4 });
    await query('UPDATE time_slots SET booked = 3 WHERE id = $1', [slotId]);

    await demoSlotService.topUpDemoSlots(14);

    const result = await query<{ booked: number }>('SELECT booked FROM time_slots WHERE id = $1', [
      slotId,
    ]);
    expect(result.rows[0].booked).toBe(3);
  });
});

describe('startDemoSlotRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('tops up at startup and then every day', () => {
    const topUp = vi.spyOn(demoSlotService, 'topUpDemoSlots').mockResolvedValue(0);
    const timer = startDemoSlotRefresh();

    expect(topUp).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(DEMO_SLOT_REFRESH_INTERVAL_MS * 2);
    expect(topUp).toHaveBeenCalledTimes(3);

    clearInterval(timer);
  });

  it('logs a failure and keeps running', async () => {
    const topUp = vi
      .spyOn(demoSlotService, 'topUpDemoSlots')
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValue(0);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const timer = startDemoSlotRefresh();

    await vi.advanceTimersByTimeAsync(DEMO_SLOT_REFRESH_INTERVAL_MS);

    expect(log).toHaveBeenCalledWith('Demo slot refresh failed', expect.any(Error));
    expect(topUp).toHaveBeenCalledTimes(2);

    clearInterval(timer);
  });
});
