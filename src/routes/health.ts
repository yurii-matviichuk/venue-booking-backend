import express from 'express';
import * as healthController from '../controllers/health.js';

const healthRouter = express.Router();

healthRouter.get('/', healthController.check);

export default healthRouter;
