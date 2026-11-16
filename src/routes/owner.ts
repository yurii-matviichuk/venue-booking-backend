import express from 'express';
import * as ownerController from '../controllers/owner.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const ownerRouter = express.Router();

ownerRouter.get('/bookings', requireAuth, requireRole('owner'), ownerController.listBookings);

export default ownerRouter;
