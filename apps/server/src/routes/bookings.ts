import { Router } from 'express';
import { eq } from 'drizzle-orm';
import type { Database } from '../db/types.ts';
import { bookings } from 'utils/db-schema';
import { createBookingSchema, bookingIdParamSchema } from 'utils/booking-schema';
import { createIdempotencyMiddleware } from '../middleware/idempotency.ts';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter.ts';
import { sendProblem, formatZodError } from '../utils/problemDetails.ts';

export function createBookingsRouter(db: Database) {
  const router = Router();
  const idempotency = createIdempotencyMiddleware(db);

  router.get('/', readLimiter, async (_req, res) => {
    const data = await db.select().from(bookings);
    res.json({ data });
  });

  router.get('/:id', readLimiter, async (req, res) => {
    const idResult = bookingIdParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      sendProblem(res, 400, 'Invalid identifier format', req.originalUrl);
      return;
    }

    const [booking] = await db.select().from(bookings).where(eq(bookings.id, idResult.data));
    if (!booking) {
      sendProblem(res, 404, `Booking '${req.params.id}' not found`, req.originalUrl);
      return;
    }
    res.json(booking);
  });

  router.post('/', writeLimiter, idempotency, async (req, res) => {
    const result = createBookingSchema.safeParse(req.body);
    if (!result.success) {
      sendProblem(res, 400, formatZodError(result.error), req.originalUrl);
      return;
    }
    const [newBooking] = await db.insert(bookings).values(result.data).returning();
    res.status(201).json(newBooking);
  });

  return router;
}
