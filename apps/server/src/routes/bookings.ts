import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { createBookingSchema } from '../schemas/booking.schema.ts';
import { mockBookings } from '../data/mockBookings.ts';

export const bookingsRouter = Router();

bookingsRouter.get('/', (_req, res) => {
  res.json({ data: mockBookings });
});

bookingsRouter.get('/:id', (req, res) => {
  const booking = mockBookings.find((b) => b.id === req.params.id);
  if (!booking) {
    res.status(404).json({ error: `Booking '${req.params.id}' not found` });
    return;
  }
  res.json(booking);
});

bookingsRouter.post('/', (req, res) => {
  const result = createBookingSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const newBooking = {
    id: `bkg-${randomUUID()}`,
    ...result.data,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };

  mockBookings.push(newBooking);
  res.status(201).json(newBooking);
});
