import { type Request, type Response } from 'express';
import type { User } from '../types/models.js';
import { loginSchema, registerSchema } from '../validation/schemas.js';
import * as authService from '../services/auth.js';
import { AUTH_COOKIE, SESSION_TTL_SECONDS } from '../services/auth.js';
import { AppError } from '../errors.js';

// The session token lives in an httpOnly cookie, so page scripts can't read it
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

const setAuthCookie = async (res: Response, userId: string) => {
  const token = await authService.createSession(userId);
  res.cookie(AUTH_COOKIE, token, {
    ...cookieOptions,
    maxAge: SESSION_TTL_SECONDS * 1000,
  });
};

export const register = async (req: Request, res: Response<{ user: User }>) => {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    throw new AppError('VALIDATION_FAILED', validation.error.issues);
  }

  const user = await authService.register(validation.data);
  await setAuthCookie(res, user.id);

  return res.status(201).json({ user });
};

export const login = async (req: Request, res: Response<{ user: User }>) => {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    throw new AppError('VALIDATION_FAILED', validation.error.issues);
  }

  const user = await authService.login(validation.data);
  await setAuthCookie(res, user.id);

  return res.json({ user });
};

export const logout = async (req: Request, res: Response) => {
  // Delete the session on the server, so the token stops working everywhere, not just in this browser
  const token = req.cookies?.[AUTH_COOKIE];
  if (typeof token === 'string') {
    await authService.deleteSession(token);
  }

  res.clearCookie(AUTH_COOKIE, cookieOptions);
  return res.status(204).end();
};

// Mounted behind requireAuth, so req.user is always set here
export const me = (req: Request, res: Response<{ user: User }>) => {
  if (!req.user) {
    throw new AppError('UNAUTHORIZED');
  }
  return res.json({ user: req.user });
};
