import type { NextFunction, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AppError } from '../errors.js';

// Limits are skipped under test so the integration suite can make many requests.
// tests/rateLimit.test.ts sets RATE_LIMIT_IN_TESTS to switch them back on.
const skip = () => process.env.NODE_ENV === 'test' && process.env.RATE_LIMIT_IN_TESTS !== 'true';

// Hand the error to the app's error handler so the 429 has the usual { error, code } shape
const handler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError('RATE_LIMITED'));
};

// Brute-force and signup-spam protection: register and login only
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  handler,
});

// Generous limit for every /api route
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  handler,
});
