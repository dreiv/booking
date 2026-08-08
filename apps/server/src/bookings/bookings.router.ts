import { Router } from 'express';
import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { Database } from '../shared/db/types.ts';
import { booking } from 'utils/db-schema';
import {
  createBookingSchema,
  updateBookingSchema,
  bookingIdParamSchema,
  bookingQuerySchema,
  isValidBookingDateRange,
  isCancellationAllowed,
} from 'utils/booking-schema';
import { createIdempotencyMiddleware } from '../idempotency/idempotency.middleware.ts';
import { readLimiter, writeLimiter } from '../shared/http/rateLimiter.ts';
import { queryParamGuard } from '../shared/http/queryParamGuard.ts';
import { sendProblem, formatZodError } from '../shared/http/problemDetails.ts';
import { requireSelfOrRole, getUserId } from '../shared/http/auth.ts';
import {
  holdInventory,
  releaseInventory,
  InsufficientInventoryError,
  RoomTypeNotFoundError,
} from '../search/availability.ts';

class BookingCancelledError extends Error {}
class InvalidDateRangeError extends Error {}

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

    // Guests are restricted to their own reservations; hosts/admins view all bookings.
    const role = req.user?.role ?? 'guest';
    if (role === 'guest') {
      const userId = getUserId(req);
      if (userId === undefined) {
        sendProblem(res, 401, 'Authentication required', req.originalUrl);
        return;
      }
      conditions.push(eq(booking.userId, userId));
    }
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
    if (!requireSelfOrRole(found.userId, req, res, ['host'])) return;
    res.json(found);
  });

  router.post('/', writeLimiter, idempotency, async (req, res) => {
    const result = createBookingSchema.safeParse(req.body);
    if (!result.success) {
      sendProblem(res, 400, formatZodError(result.error), req.originalUrl);
      return;
    }
    const input = result.data;

    const role = req.user?.role ?? 'guest';
    if (role === 'guest' && input.userId !== getUserId(req)) {
      sendProblem(res, 403, 'You can only create a booking for yourself', req.originalUrl);
      return;
    }

    const roomCount = input.roomCount ?? 1;

    try {
      const newBooking = await db.transaction(async (tx) => {
        // Locks nights and checks overbooking capacity atomically before creating the reservation.
        await holdInventory(tx, {
          hotelId: input.hotelId,
          roomTypeId: input.roomTypeId,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          roomCount,
        });
        const [created] = await tx
          .insert(booking)
          .values({ ...input, roomCount })
          .returning();
        return created;
      });
      res.status(201).json(newBooking);
    } catch (err) {
      if (err instanceof InsufficientInventoryError) {
        sendProblem(res, 409, `No availability for '${err.date}'`, req.originalUrl);
        return;
      }
      if (err instanceof RoomTypeNotFoundError) {
        sendProblem(res, 400, err.message, req.originalUrl);
        return;
      }
      throw err;
    }
  });

  router.put('/:id', writeLimiter, async (req, res) => {
    const idResult = bookingIdParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      sendProblem(res, 400, 'Invalid identifier format', req.originalUrl);
      return;
    }
    const bodyResult = updateBookingSchema.safeParse(req.body);
    if (!bodyResult.success) {
      sendProblem(res, 400, formatZodError(bodyResult.error), req.originalUrl);
      return;
    }

    // Pre-flight authorization check avoids locking DB rows for unauthorized callers.
    const [existingForAuth] = await db
      .select({ userId: booking.userId })
      .from(booking)
      .where(eq(booking.bookingId, idResult.data));
    if (!existingForAuth) {
      sendProblem(res, 404, `Booking '${idResult.data}' not found`, req.originalUrl);
      return;
    }
    if (!requireSelfOrRole(existingForAuth.userId, req, res, ['host'])) return;

    try {
      const updated = await db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(booking)
          .where(eq(booking.bookingId, idResult.data));
        if (!existing) return undefined;
        if (existing.status === 'cancelled') throw new BookingCancelledError();

        const next = {
          checkIn: bodyResult.data.checkIn ?? existing.checkIn,
          checkOut: bodyResult.data.checkOut ?? existing.checkOut,
          roomCount: bodyResult.data.roomCount ?? existing.roomCount,
        };
        if (!isValidBookingDateRange(next.checkIn, next.checkOut)) {
          throw new InvalidDateRangeError();
        }

        const stayChanged =
          next.checkIn !== existing.checkIn ||
          next.checkOut !== existing.checkOut ||
          next.roomCount !== existing.roomCount;

        if (stayChanged) {
          // Releases previous hold and reserves new dates atomically so failures trigger a rollback.
          await releaseInventory(tx, {
            hotelId: existing.hotelId,
            roomTypeId: existing.roomTypeId,
            checkIn: existing.checkIn,
            checkOut: existing.checkOut,
            roomCount: existing.roomCount,
          });
          await holdInventory(tx, {
            hotelId: existing.hotelId,
            roomTypeId: existing.roomTypeId,
            checkIn: next.checkIn,
            checkOut: next.checkOut,
            roomCount: next.roomCount,
          });
        }

        const [row] = await tx
          .update(booking)
          .set(next)
          .where(eq(booking.bookingId, idResult.data))
          .returning();
        return row;
      });

      if (!updated) {
        sendProblem(res, 404, `Booking '${idResult.data}' not found`, req.originalUrl);
        return;
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof InsufficientInventoryError) {
        sendProblem(res, 409, `No availability for '${err.date}'`, req.originalUrl);
        return;
      }
      if (err instanceof BookingCancelledError) {
        sendProblem(res, 400, 'Cannot edit a cancelled booking', req.originalUrl);
        return;
      }
      if (err instanceof InvalidDateRangeError) {
        sendProblem(res, 400, 'checkOut must be after checkIn', req.originalUrl);
        return;
      }
      throw err;
    }
  });

  router.delete('/:id', writeLimiter, async (req, res) => {
    const idResult = bookingIdParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      sendProblem(res, 400, 'Invalid identifier format', req.originalUrl);
      return;
    }

    const [existingForAuth] = await db
      .select({ userId: booking.userId })
      .from(booking)
      .where(eq(booking.bookingId, idResult.data));
    if (!existingForAuth) {
      sendProblem(res, 404, `Booking '${idResult.data}' not found`, req.originalUrl);
      return;
    }
    if (!requireSelfOrRole(existingForAuth.userId, req, res, ['host'])) return;

    const outcome = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(booking)
        .where(eq(booking.bookingId, idResult.data));
      if (!existing) return { kind: 'not-found' as const };
      if (existing.status === 'cancelled') return { kind: 'ok' as const, booking: existing };
      if (!isCancellationAllowed(existing.checkIn)) return { kind: 'policy-denied' as const };

      await releaseInventory(tx, {
        hotelId: existing.hotelId,
        roomTypeId: existing.roomTypeId,
        checkIn: existing.checkIn,
        checkOut: existing.checkOut,
        roomCount: existing.roomCount,
      });
      const [row] = await tx
        .update(booking)
        .set({ status: 'cancelled' })
        .where(eq(booking.bookingId, idResult.data))
        .returning();
      return { kind: 'ok' as const, booking: row };
    });

    if (outcome.kind === 'not-found') {
      sendProblem(res, 404, `Booking '${idResult.data}' not found`, req.originalUrl);
      return;
    }
    if (outcome.kind === 'policy-denied') {
      sendProblem(
        res,
        400,
        'Cancellations must be made at least 24 hours before check-in',
        req.originalUrl,
      );
      return;
    }
    res.json(outcome.booking);
  });

  return router;
}
