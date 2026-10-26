import express from 'express';
import * as bookingController from '../controllers/booking.js';
import { requireAuth } from '../middleware/requireAuth.js';

const bookingRouter = express.Router();

bookingRouter.get('/', requireAuth, bookingController.list);
bookingRouter.post('/', requireAuth, bookingController.create);
bookingRouter.put('/:id', requireAuth, bookingController.updateStatus);

export default bookingRouter;
