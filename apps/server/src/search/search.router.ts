import { Router } from 'express';
import { and, eq, gte, ilike, inArray, sql } from 'drizzle-orm';
import type { Database } from '../shared/db/types.ts';
import { hotel, roomType, roomTypeInventory, roomTypeRate } from 'utils/db-schema';
import { searchQuerySchema } from 'utils/search-schema';
import { getNightsInRange } from 'utils/booking-schema';
import { readLimiter } from '../shared/http/rateLimiter.ts';
import { queryParamGuard } from '../shared/http/queryParamGuard.ts';
import { sendProblem, formatZodError } from '../shared/http/problemDetails.ts';

interface AvailableCandidate {
  hotelId: number;
  roomTypeId: number;
  nightlyRates: { date: string; rate: string }[];
  totalPrice: number;
  roomsAvailable: number;
}

export function createSearchRouter(db: Database) {
  const router = Router();

  router.get('/', readLimiter, queryParamGuard, async (req, res) => {
    const queryResult = searchQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      sendProblem(res, 400, formatZodError(queryResult.error), req.originalUrl);
      return;
    }
    const { location, checkIn, checkOut, guests, priceMin, priceMax, amenities, page, limit } =
      queryResult.data;
    const nights = getNightsInRange(checkIn, checkOut);

    const candidateConditions = [gte(roomType.maxOccupancy, guests)];
    if (location) {
      candidateConditions.push(ilike(hotel.location, `%${location}%`));
    }
    if (amenities && amenities.length > 0) {
      candidateConditions.push(sql`${roomType.amenities} @> ${amenities}`);
    }

    const candidates = await db
      .select({
        hotelId: hotel.hotelId,
        roomTypeId: roomType.roomTypeId,
        overbookingRate: roomType.overbookingRate,
      })
      .from(roomType)
      .innerJoin(hotel, eq(hotel.hotelId, roomType.hotelId))
      .where(and(...candidateConditions));

    if (candidates.length === 0) {
      res.json({ data: [], meta: { page, limit, totalRecords: 0, totalPages: 0 } });
      return;
    }

    const roomTypeIds = candidates.map((c) => c.roomTypeId);

    // Bulk-fetches inventory and rates across candidates to optimize high-traffic read performance.
    const [inventoryRows, rateRows] = await Promise.all([
      db
        .select()
        .from(roomTypeInventory)
        .where(
          and(
            inArray(roomTypeInventory.roomTypeId, roomTypeIds),
            inArray(roomTypeInventory.date, nights),
          ),
        ),
      db
        .select()
        .from(roomTypeRate)
        .where(
          and(inArray(roomTypeRate.roomTypeId, roomTypeIds), inArray(roomTypeRate.date, nights)),
        ),
    ]);

    const rateByKey = new Map(
      rateRows.map((r) => [`${r.hotelId}:${r.roomTypeId}:${r.date}`, r.rate]),
    );
    const inventoryByRoomType = new Map<number, typeof inventoryRows>();
    for (const row of inventoryRows) {
      const list = inventoryByRoomType.get(row.roomTypeId) ?? [];
      list.push(row);
      inventoryByRoomType.set(row.roomTypeId, list);
    }

    const available: AvailableCandidate[] = [];

    for (const candidate of candidates) {
      const rows = inventoryByRoomType.get(candidate.roomTypeId) ?? [];
      if (rows.length !== nights.length) continue;

      const overbookingRate = Number(candidate.overbookingRate);
      let roomsAvailable = Infinity;
      let totalPrice = 0;
      const nightlyRates: { date: string; rate: string }[] = [];
      let missingRate = false;

      for (const row of rows) {
        const capacity = Math.floor(row.totalInventory * (1 + overbookingRate));
        roomsAvailable = Math.min(roomsAvailable, capacity - row.totalReserved);

        const rate = rateByKey.get(`${candidate.hotelId}:${candidate.roomTypeId}:${row.date}`);
        if (rate === undefined) {
          missingRate = true;
          break;
        }
        nightlyRates.push({ date: row.date, rate });
        totalPrice += Number(rate);
      }

      if (missingRate || roomsAvailable <= 0) continue;
      if (priceMin !== undefined && totalPrice < priceMin) continue;
      if (priceMax !== undefined && totalPrice > priceMax) continue;

      available.push({
        hotelId: candidate.hotelId,
        roomTypeId: candidate.roomTypeId,
        nightlyRates: nightlyRates.sort((a, b) => a.date.localeCompare(b.date)),
        totalPrice,
        roomsAvailable,
      });
    }

    available.sort((a, b) => a.totalPrice - b.totalPrice);

    const totalRecords = available.length;
    const offset = (page - 1) * limit;
    const pageSlice = available.slice(offset, offset + limit);

    const hotelIds = [...new Set(pageSlice.map((r) => r.hotelId))];
    const pageRoomTypeIds = [...new Set(pageSlice.map((r) => r.roomTypeId))];

    const [hotelRows, roomTypeRows] = await Promise.all([
      hotelIds.length > 0 ? db.select().from(hotel).where(inArray(hotel.hotelId, hotelIds)) : [],
      pageRoomTypeIds.length > 0
        ? db.select().from(roomType).where(inArray(roomType.roomTypeId, pageRoomTypeIds))
        : [],
    ]);
    const hotelById = new Map(hotelRows.map((h) => [h.hotelId, h]));
    const roomTypeById = new Map(roomTypeRows.map((r) => [r.roomTypeId, r]));

    const data = pageSlice
      .map((result) => ({
        hotel: hotelById.get(result.hotelId),
        roomType: roomTypeById.get(result.roomTypeId),
        nightlyRates: result.nightlyRates,
        totalPrice: result.totalPrice.toFixed(2),
        roomsAvailable: result.roomsAvailable,
      }))
      .filter((result) => result.hotel && result.roomType);

    res.json({
      data,
      meta: { page, limit, totalRecords, totalPages: Math.ceil(totalRecords / limit) },
    });
  });

  return router;
}
