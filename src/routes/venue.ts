import express from 'express';
import * as venueController from '../controllers/venue';

const venueRouter = express.Router();

venueRouter.get('/', venueController.getAll);
venueRouter.get('/:id', venueController.getById);

export default venueRouter;
