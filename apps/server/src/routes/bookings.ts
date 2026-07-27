import { Router } from 'express';
import { eq } from 'drizzle-orm';
import type { Database } from '../db/types.ts';
import { bookings } from '../db/schema.ts';
import { createBookingSchema } from '../schemas/booking.schema.ts';

export function createBookingsRouter(db: Database) {
  const router = Router();

  router.get('/', async (_req, res) => {
    const data = await db.select().from(bookings);
    res.json({ data });
  });

  router.get('/:id', async (req, res) => {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, req.params.id));
    if (!booking) {
      res.status(404).json({ error: `Booking '${req.params.id}' not found` });
      return;
    }
    res.json(booking);
  });

  router.post('/', async (req, res) => {
    const result = createBookingSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.flatten() });
      return;
    }
    const [newBooking] = await db.insert(bookings).values(result.data).returning();
    res.status(201).json(newBooking);
  });

  return router;
}
