import express from 'express';
import * as bookingController from '../controllers/booking';

const bookingRouter = express.Router();

bookingRouter.post('/', bookingController.create);
bookingRouter.put('/:bookingId', bookingController.updateStatus);

export default bookingRouter;
