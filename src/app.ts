// Must stay the first import: ES modules run imports in order, and the database pool
// reads DATABASE_URL when src/db/connection.ts loads, so dotenv has to run before it.
import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import authRouter from './routes/auth.js';
import bookingRouter from './routes/booking.js';
import venueRouter from './routes/venue.js';
import cityRouter from './routes/city.js';
import availabilityRouter from './routes/availability.js';
import healthRouter from './routes/health.js';
import { AppError } from './errors.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  // Cookies need an explicit origin and credentials: browsers ignore cookies when the origin is '*'
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  // Request logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  // Routes
  app.use('/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/bookings', bookingRouter);
  app.use('/api/venues', venueRouter);
  app.use('/api/cities', cityRouter);
  app.use('/api/availability', availabilityRouter);

  // 404 handler: unmatched routes go to the error handler below
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError('ROUTE_NOT_FOUND'));
  });

  // Error handling middleware: turns every error into a JSON response
  app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    // Once a response has started, Express needs the error handed to its default handler
    if (res.headersSent) return next(err);

    // express.json() throws a parse error for malformed bodies; report it as a client error
    const isJsonParseError = (err as { type?: string }).type === 'entity.parse.failed';

    let error: AppError;
    if (err instanceof AppError) {
      error = err;
    } else if (isJsonParseError) {
      error = new AppError('INVALID_JSON');
    } else {
      // Anything else is a bug or an outage: log it and report an internal error
      console.error(err);
      error = new AppError('INTERNAL_ERROR');
    }

    return res.status(error.status).json({
      error: error.message,
      code: error.code,
      ...(error.details !== undefined ? { details: error.details } : {}),
    });
  });

  return app;
}
