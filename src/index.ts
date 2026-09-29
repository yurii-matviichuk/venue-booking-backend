import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Express, type Request, type Response } from 'express';
import bookingRouter from './routes/booking';
import venueRouter from './routes/venue';
import availabilityRouter from './routes/availability';

dotenv.config();

const app: Express = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/bookings', bookingRouter);
app.use('/api/venues', venueRouter);
app.use('/api/availability', availabilityRouter);

app.get('/health', (req: Request, res: Response<{ status: string }>) => {
  return res.json({ status: 'Server running ✅' });
});

// 404 handler
app.use((req: Request, res: Response<{ error: string }>) => {
  return res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api/venues`);
});
