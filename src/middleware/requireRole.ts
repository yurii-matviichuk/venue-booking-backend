import type { NextFunction, Request, Response } from 'express';
import type { User } from '../types/models.js';
import { AppError } from '../errors.js';

// Must run after requireAuth. Rejects logged-in users whose role is not one of the given roles
export const requireRole =
  (...roles: User['role'][]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError('FORBIDDEN');
    }
    next();
  };
