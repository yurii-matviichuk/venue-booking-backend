import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import bookingRouter from './routes/booking';
import venueRouter from './routes/venue';
import availabilityRouter from './routes/availability';
import healthRouter from './routes/health';

dotenv.config();

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Request logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  // Routes
  app.use('/health', healthRouter);
  app.use('/api/bookings', bookingRouter);
  app.use('/api/venues', venueRouter);
  app.use('/api/availability', availabilityRouter);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    return res.status(404).json({ error: 'Route not found' });
  });

  // Error handling middleware
  app.use((err: Error, _req: Request, res: Response) => {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

// Server startup
const app = createApp();
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
