import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Database } from '../shared/db/types.ts';
import { roomType, roomTypeInventory } from 'utils/db-schema';
import { getNightsInRange } from 'utils/booking-schema';

export class InsufficientInventoryError extends Error {
  readonly date: string;

  constructor(date: string) {
    super(`No rooms available for ${date}`);
    this.name = 'InsufficientInventoryError';
    this.date = date;
  }
}

export class RoomTypeNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoomTypeNotFoundError';
  }
}

export interface InventoryHold {
  hotelId: number;
  roomTypeId: number;
  checkIn: string;
  checkOut: string;
  roomCount: number;
}

/**
 * Reserves inventory using pessimistic locking (`SELECT ... FOR UPDATE`).
 * Must run inside a transaction context (`db.transaction`).
 */
export async function holdInventory(tx: Database, hold: InventoryHold): Promise<void> {
  const nights = getNightsInRange(hold.checkIn, hold.checkOut);
  if (nights.length === 0) return;

  const [roomTypeRow] = await tx
    .select({ overbookingRate: roomType.overbookingRate })
    .from(roomType)
    .where(and(eq(roomType.roomTypeId, hold.roomTypeId), eq(roomType.hotelId, hold.hotelId)));

  if (!roomTypeRow) {
    throw new RoomTypeNotFoundError(
      `Room type '${hold.roomTypeId}' not found for hotel '${hold.hotelId}'`,
    );
  }
  const overbookingRate = Number(roomTypeRow.overbookingRate);

  const inventoryRows = await tx
    .select()
    .from(roomTypeInventory)
    .where(
      and(
        eq(roomTypeInventory.hotelId, hold.hotelId),
        eq(roomTypeInventory.roomTypeId, hold.roomTypeId),
        inArray(roomTypeInventory.date, nights),
      ),
    )
    .for('update');

  const byDate = new Map(inventoryRows.map((row) => [row.date, row]));

  for (const night of nights) {
    const row = byDate.get(night);
    if (!row) throw new InsufficientInventoryError(night);

    const capacity = Math.floor(row.totalInventory * (1 + overbookingRate));
    if (row.totalReserved + hold.roomCount > capacity) {
      throw new InsufficientInventoryError(night);
    }
  }

  await tx
    .update(roomTypeInventory)
    .set({ totalReserved: sql`${roomTypeInventory.totalReserved} + ${hold.roomCount}` })
    .where(
      and(
        eq(roomTypeInventory.hotelId, hold.hotelId),
        eq(roomTypeInventory.roomTypeId, hold.roomTypeId),
        inArray(roomTypeInventory.date, nights),
      ),
    );
}

/**
 * Releases held inventory for a stay (cancellation or update).
 */
export async function releaseInventory(tx: Database, hold: InventoryHold): Promise<void> {
  const nights = getNightsInRange(hold.checkIn, hold.checkOut);
  if (nights.length === 0) return;

  await tx
    .update(roomTypeInventory)
    .set({
      totalReserved: sql`GREATEST(${roomTypeInventory.totalReserved} - ${hold.roomCount}, 0)`,
    })
    .where(
      and(
        eq(roomTypeInventory.hotelId, hold.hotelId),
        eq(roomTypeInventory.roomTypeId, hold.roomTypeId),
        inArray(roomTypeInventory.date, nights),
      ),
    );
}
