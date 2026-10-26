import express from 'express';
import * as cityController from '../controllers/city.js';

const cityRouter = express.Router();

cityRouter.get('/', cityController.getAll);

export default cityRouter;
