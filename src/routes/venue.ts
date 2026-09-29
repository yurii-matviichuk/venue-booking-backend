import express, { type Request, type Response } from 'express';
import * as venueController from '../controllers/venue';

const venueRouter = express.Router();

venueRouter.get('/', venueController.getAll);
venueRouter.get('/:venueId', venueController.getById);

export default venueRouter;
