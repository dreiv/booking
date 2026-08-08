import { Router } from 'express';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../shared/db/types.ts';
import { roomType } from 'utils/db-schema';
import {
  createRoomTypeSchema,
  updateRoomTypeSchema,
  roomTypeIdParamSchema,
} from 'utils/room-type-schema';
import { hotelIdParamSchema } from 'utils/hotel-schema';
import { readLimiter, writeLimiter } from '../shared/http/rateLimiter.ts';
import { sendProblem, formatZodError } from '../shared/http/problemDetails.ts';
import { requireRole } from '../shared/http/auth.ts';

// Mounted at /api/hotels/:hotelId/room-types — mergeParams exposes parent route parameter :hotelId.
export function createRoomTypesRouter(db: Database) {
  const router = Router({ mergeParams: true });

  function parseHotelId(hotelIdParam: unknown) {
    return hotelIdParamSchema.safeParse(hotelIdParam);
  }

  router.get('/:roomTypeId', readLimiter, async (req, res) => {
    const hotelIdResult = parseHotelId(req.params.hotelId);
    const roomTypeIdResult = roomTypeIdParamSchema.safeParse(req.params.roomTypeId);
    if (!hotelIdResult.success || !roomTypeIdResult.success) {
      sendProblem(res, 400, 'Invalid identifier format', req.originalUrl);
      return;
    }

    const [found] = await db
      .select()
      .from(roomType)
      .where(
        and(
          eq(roomType.hotelId, hotelIdResult.data),
          eq(roomType.roomTypeId, roomTypeIdResult.data),
        ),
      );
    if (!found) {
      sendProblem(res, 404, `Room type '${roomTypeIdResult.data}' not found`, req.originalUrl);
      return;
    }
    res.json(found);
  });

  router.post('/', writeLimiter, requireRole('host'), async (req, res) => {
    const hotelIdResult = parseHotelId(req.params.hotelId);
    if (!hotelIdResult.success) {
      sendProblem(res, 400, 'Invalid identifier format', req.originalUrl);
      return;
    }
    const bodyResult = createRoomTypeSchema.safeParse(req.body);
    if (!bodyResult.success) {
      sendProblem(res, 400, formatZodError(bodyResult.error), req.originalUrl);
      return;
    }

    const [created] = await db
      .insert(roomType)
      .values({ ...bodyResult.data, hotelId: hotelIdResult.data })
      .returning();
    res.status(201).json(created);
  });

  router.put('/:roomTypeId', writeLimiter, requireRole('host'), async (req, res) => {
    const hotelIdResult = parseHotelId(req.params.hotelId);
    const roomTypeIdResult = roomTypeIdParamSchema.safeParse(req.params.roomTypeId);
    if (!hotelIdResult.success || !roomTypeIdResult.success) {
      sendProblem(res, 400, 'Invalid identifier format', req.originalUrl);
      return;
    }
    const bodyResult = updateRoomTypeSchema.safeParse(req.body);
    if (!bodyResult.success) {
      sendProblem(res, 400, formatZodError(bodyResult.error), req.originalUrl);
      return;
    }

    const [updated] = await db
      .update(roomType)
      .set(bodyResult.data)
      .where(
        and(
          eq(roomType.hotelId, hotelIdResult.data),
          eq(roomType.roomTypeId, roomTypeIdResult.data),
        ),
      )
      .returning();
    if (!updated) {
      sendProblem(res, 404, `Room type '${roomTypeIdResult.data}' not found`, req.originalUrl);
      return;
    }
    res.json(updated);
  });

  router.delete('/:roomTypeId', writeLimiter, requireRole('host'), async (req, res) => {
    const hotelIdResult = parseHotelId(req.params.hotelId);
    const roomTypeIdResult = roomTypeIdParamSchema.safeParse(req.params.roomTypeId);
    if (!hotelIdResult.success || !roomTypeIdResult.success) {
      sendProblem(res, 400, 'Invalid identifier format', req.originalUrl);
      return;
    }

    const [deleted] = await db
      .delete(roomType)
      .where(
        and(
          eq(roomType.hotelId, hotelIdResult.data),
          eq(roomType.roomTypeId, roomTypeIdResult.data),
        ),
      )
      .returning();
    if (!deleted) {
      sendProblem(res, 404, `Room type '${roomTypeIdResult.data}' not found`, req.originalUrl);
      return;
    }
    res.status(204).end();
  });

  return router;
}
