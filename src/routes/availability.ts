import express from 'express';
import * as availabilityController from '../controllers/availability';

const availabilityRouter = express.Router();

availabilityRouter.get('/:venueId', availabilityController.getByVenue);

export default availabilityRouter;
