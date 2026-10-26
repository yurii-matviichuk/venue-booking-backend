import express from 'express';
import * as authController from '../controllers/auth.js';
import { requireAuth } from '../middleware/requireAuth.js';

const authRouter = express.Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', requireAuth, authController.me);

export default authRouter;
