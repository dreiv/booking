import { Router } from 'express';
import { asc, count, eq, ilike } from 'drizzle-orm';
import type { Database } from '../shared/db/types.ts';
import { hotel } from 'utils/db-schema';
import {
  createHotelSchema,
  updateHotelSchema,
  hotelIdParamSchema,
  hotelQuerySchema,
} from 'utils/hotel-schema';
import { readLimiter, writeLimiter } from '../shared/http/rateLimiter.ts';
import { queryParamGuard } from '../shared/http/queryParamGuard.ts';
import { sendProblem, formatZodError } from '../shared/http/problemDetails.ts';
import { requireRole } from '../shared/http/auth.ts';

export function createHotelsRouter(db: Database) {
  const router = Router();

  router.get('/', readLimiter, queryParamGuard, async (req, res) => {
    const queryResult = hotelQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      sendProblem(res, 400, formatZodError(queryResult.error), req.originalUrl);
      return;
    }
    const { search, page, limit } = queryResult.data;
    const whereClause = search ? ilike(hotel.location, `%${search}%`) : undefined;
    const offset = (page - 1) * limit;

    const [data, [countRow]] = await Promise.all([
      db
        .select()
        .from(hotel)
        .where(whereClause)
        .orderBy(asc(hotel.name))
        .limit(limit)
        .offset(offset),
      db.select({ totalRecords: count() }).from(hotel).where(whereClause),
    ]);
    const totalRecords = countRow?.totalRecords ?? 0;

    res.json({
      data,
      meta: { page, limit, totalRecords, totalPages: Math.ceil(totalRecords / limit) },
    });
  });

  router.get('/:id', readLimiter, async (req, res) => {
    const idResult = hotelIdParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      sendProblem(res, 400, 'Invalid identifier format', req.originalUrl);
      return;
    }

    const [found] = await db.select().from(hotel).where(eq(hotel.hotelId, idResult.data));
    if (!found) {
      sendProblem(res, 404, `Hotel '${idResult.data}' not found`, req.originalUrl);
      return;
    }
    res.json(found);
  });

  router.post('/', writeLimiter, requireRole('host'), async (req, res) => {
    const result = createHotelSchema.safeParse(req.body);
    if (!result.success) {
      sendProblem(res, 400, formatZodError(result.error), req.originalUrl);
      return;
    }
    const [created] = await db.insert(hotel).values(result.data).returning();
    res.status(201).json(created);
  });

  router.put('/:id', writeLimiter, requireRole('host'), async (req, res) => {
    const idResult = hotelIdParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      sendProblem(res, 400, 'Invalid identifier format', req.originalUrl);
      return;
    }
    const bodyResult = updateHotelSchema.safeParse(req.body);
    if (!bodyResult.success) {
      sendProblem(res, 400, formatZodError(bodyResult.error), req.originalUrl);
      return;
    }

    const [updated] = await db
      .update(hotel)
      .set(bodyResult.data)
      .where(eq(hotel.hotelId, idResult.data))
      .returning();
    if (!updated) {
      sendProblem(res, 404, `Hotel '${idResult.data}' not found`, req.originalUrl);
      return;
    }
    res.json(updated);
  });

  router.delete('/:id', writeLimiter, requireRole('host'), async (req, res) => {
    const idResult = hotelIdParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      sendProblem(res, 400, 'Invalid identifier format', req.originalUrl);
      return;
    }

    const [deleted] = await db.delete(hotel).where(eq(hotel.hotelId, idResult.data)).returning();
    if (!deleted) {
      sendProblem(res, 404, `Hotel '${idResult.data}' not found`, req.originalUrl);
      return;
    }
    res.status(204).end();
  });

  return router;
}
