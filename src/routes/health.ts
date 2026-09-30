import express, { type Request, type Response } from 'express';

const healthRouter = express.Router();

healthRouter.get('/', (_req: Request, res: Response<{ status: string }>) => {
  return res.json({ status: 'Server running ✅' });
});

export default healthRouter;
