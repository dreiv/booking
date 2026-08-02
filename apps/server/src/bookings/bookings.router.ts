import { Router } from 'express';
import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { Database } from '../shared/db/types.ts';
import { booking } from 'utils/db-schema';
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
    if (search) {
      conditions.push(
        or(
          ilike(booking.guestFirstName, `%${search}%`),
          ilike(booking.guestLastName, `%${search}%`),
        )!,
      );
    }
    if (status) conditions.push(eq(booking.status, status));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = booking[sortBy];
    const orderBy = order === 'asc' ? asc(sortColumn) : desc(sortColumn);
    const offset = (page - 1) * limit;

    const [data, [countRow]] = await Promise.all([
      db.select().from(booking).where(whereClause).orderBy(orderBy).limit(limit).offset(offset),
      db.select({ totalRecords: count() }).from(booking).where(whereClause),
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

    const [found] = await db.select().from(booking).where(eq(booking.bookingId, idResult.data));
    if (!found) {
      sendProblem(res, 404, `Booking '${idResult.data}' not found`, req.originalUrl);
      return;
    }
    res.json(found);
  });

  router.post('/', writeLimiter, idempotency, async (req, res) => {
    const result = createBookingSchema.safeParse(req.body);
    if (!result.success) {
      sendProblem(res, 400, formatZodError(result.error), req.originalUrl);
      return;
    }
    const [newBooking] = await db.insert(booking).values(result.data).returning();
    res.status(201).json(newBooking);
  });

  return router;
}
