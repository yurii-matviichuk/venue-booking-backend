import { type Request, type Response } from 'express';
import * as healthService from '../services/health.js';

export const check = async (_req: Request, res: Response<{ status: string }>) => {
  await healthService.checkDatabase();
  return res.json({ status: 'ok' });
};
