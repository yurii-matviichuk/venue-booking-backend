import * as demoSlotService from '../services/demoSlots.js';

export const DEMO_SLOT_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

const refreshSlots = () =>
  demoSlotService
    .topUpDemoSlots()
    .then((added) => {
      if (added > 0) console.log(`Demo slot refresh added ${added} slots`);
    })
    .catch((err) => console.error('Demo slot refresh failed', err));

// Demo databases only (see DEMO_SLOT_REFRESH in server.ts). Runs once now, then every day.
// The timer is unref'd so it never keeps the process alive
export const startDemoSlotRefresh = (): NodeJS.Timeout => {
  void refreshSlots();
  return setInterval(refreshSlots, DEMO_SLOT_REFRESH_INTERVAL_MS).unref();
};
