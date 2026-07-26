import express from 'express';
import { bookingsRouter } from './routes/bookings.ts';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/bookings', bookingsRouter);

  return app;
}
