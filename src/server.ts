// Entry point: starts the HTTP server. The app itself lives in app.ts so tests can import it without binding a port.
import { createApp } from './app.js';
import { startSessionCleanup } from './jobs/sessionCleanup.js';

if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL) {
  throw new Error('CLIENT_URL must be set in production');
}

const app = createApp();
const PORT = process.env.PORT || 5001;

startSessionCleanup();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
