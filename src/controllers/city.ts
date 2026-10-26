import { type Request, type Response } from 'express';
import * as cityService from '../services/city.js';

export const getAll = async (_req: Request, res: Response<string[]>) => {
  const cities = await cityService.getAllCities();
  return res.json(cities);
};
