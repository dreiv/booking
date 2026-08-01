import { Router } from 'express';
import { and, asc, count, desc, eq, ilike } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { Database } from '../shared/db/types.ts';
import { bookings } from 'utils/db-schema';
import {
  createBookingSchema,
  bookingIdParamSchema,
  bookingQuerySchema,
} from 'utils/booking-schema';
import { createIdempotencyMiddleware } from '../idempotency/idempotency.middleware.ts';
import { readLimiter, writeLimiter } from '../shared/http/rateLimiter.ts';
import { queryParamGuard } from '../shared/http/queryParamGuard.ts';
import { sendProblem, formatZodError } from '../shared/http/problemDetails.ts';

export function createBookingsRouter(db: Database) {
  const router = Router();
  const idempotency = createIdempotencyMiddleware(db);

  router.get('/', readLimiter, queryParamGuard, async (req, res) => {
    const queryResult = bookingQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      sendProblem(res, 400, formatZodError(queryResult.error), req.originalUrl);
      return;
    }
    const { search, status, sortBy, order, page, limit } = queryResult.data;

    const conditions: SQL[] = [];
    if (search) conditions.push(ilike(bookings.guestName, `%${search}%`));
    if (status) conditions.push(eq(bookings.status, status));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = bookings[sortBy];
    const orderBy = order === 'asc' ? asc(sortColumn) : desc(sortColumn);
    const offset = (page - 1) * limit;

    const [data, [countRow]] = await Promise.all([
      db.select().from(bookings).where(whereClause).orderBy(orderBy).limit(limit).offset(offset),
      db.select({ totalRecords: count() }).from(bookings).where(whereClause),
    ]);
    const totalRecords = countRow?.totalRecords ?? 0;

    res.json({
      data,
      meta: { page, limit, totalRecords, totalPages: Math.ceil(totalRecords / limit) },
    });
  });

  router.get('/:id', readLimiter, async (req, res) => {
    const idResult = bookingIdParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      sendProblem(res, 400, 'Invalid identifier format', req.originalUrl);
      return;
    }

    const [booking] = await db.select().from(bookings).where(eq(bookings.id, idResult.data));
    if (!booking) {
      sendProblem(res, 404, `Booking '${idResult.data}' not found`, req.originalUrl);
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
