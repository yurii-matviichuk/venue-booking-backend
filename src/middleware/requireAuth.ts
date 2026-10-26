import type { NextFunction, Request, Response } from 'express';
import type { User } from '../types/models.js';
import * as authService from '../services/auth.js';
import { AUTH_COOKIE } from '../services/auth.js';
import { AppError } from '../errors.js';

// Adds req.user to Express requests. Only set on routes that run requireAuth
declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}

// Loads the logged-in user from the auth cookie onto req.user, or rejects with UNAUTHORIZED
export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.[AUTH_COOKIE];
  const user = typeof token === 'string' ? await authService.findUserBySessionToken(token) : null;

  if (!user) {
    throw new AppError('UNAUTHORIZED');
  }

  req.user = user;
  next();
};
