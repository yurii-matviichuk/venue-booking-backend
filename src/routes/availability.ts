import express from 'express';
import * as availabilityController from '../controllers/availability';

const availabilityRouter = express.Router();

availabilityRouter.get('/:id', availabilityController.getByVenue);

export default availabilityRouter;
