import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { db } from '../src/shared/db/client.ts';
import { booking, hotel, roomType, roomTypeRate, roomTypeInventory, users } from 'utils/db-schema';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, 'data.json');

interface SeedStay {
  hotel: {
    name: string;
    location: string;
    description: string;
  };
  roomType: {
    name: string;
    maxOccupancy: number;
    amenities: string[];
    overbookingRate: string;
  };
  rate: string;
  totalInventory: number;
}

const stays = JSON.parse(readFileSync(DATA_PATH, 'utf-8')) as SeedStay[];

const SEED_START = new Date().toISOString().slice(0, 10);
const SEED_NIGHTS = 90;

function datesInclusive(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00.000Z`);
  const stop = new Date(`${end}T00:00:00.000Z`);
  while (cursor <= stop) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function seedWindowDates(): string[] {
  const start = new Date(`${SEED_START}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + SEED_NIGHTS);
  return datesInclusive(SEED_START, end.toISOString().slice(0, 10));
}

const BATCH = 1000;

await db.transaction(async (tx) => {
  await tx.delete(booking);
  await tx.delete(roomTypeInventory);
  await tx.delete(roomTypeRate);
  await tx.delete(roomType);
  await tx.delete(hotel);
  await tx.delete(users);

  const hotels = await tx
    .insert(hotel)
    .values(stays.map((s) => ({ ...s.hotel, address: s.hotel.location })))
    .returning();
  if (hotels.length !== stays.length) {
    throw new Error(`Expected ${stays.length} hotels, inserted ${hotels.length}`);
  }

  const roomTypes = await tx
    .insert(roomType)
    .values(
      stays.map((s, i) => {
        const hotel = hotels[i];
        if (!hotel) throw new Error(`Missing hotel at index ${i}`);
        return {
          hotelId: hotel.hotelId,
          name: s.roomType.name,
          description: s.hotel.description,
          maxOccupancy: s.roomType.maxOccupancy,
          amenities: s.roomType.amenities,
          overbookingRate: s.roomType.overbookingRate,
        };
      }),
    )
    .returning();
  if (roomTypes.length !== stays.length) {
    throw new Error(`Expected ${stays.length} room types, inserted ${roomTypes.length}`);
  }

  const dates = seedWindowDates();
  const rateRows: { hotelId: number; roomTypeId: number; date: string; rate: string }[] = [];
  const inventoryRows: {
    hotelId: number;
    roomTypeId: number;
    date: string;
    totalInventory: number;
  }[] = [];

  for (let i = 0; i < stays.length; i++) {
    const stay = stays[i];
    const roomType = roomTypes[i];
    if (!stay || !roomType) throw new Error(`Missing stay/roomType at index ${i}`);
    for (const date of dates) {
      rateRows.push({
        hotelId: roomType.hotelId,
        roomTypeId: roomType.roomTypeId,
        date,
        rate: stay.rate,
      });
      inventoryRows.push({
        hotelId: roomType.hotelId,
        roomTypeId: roomType.roomTypeId,
        date,
        totalInventory: stay.totalInventory,
      });
    }
  }

  for (const batch of chunk(rateRows, BATCH)) {
    await tx.insert(roomTypeRate).values(batch);
  }
  for (const batch of chunk(inventoryRows, BATCH)) {
    await tx.insert(roomTypeInventory).values(batch);
  }

  await tx.insert(users).values([
    { email: 'ada@example.com', role: 'guest', firstName: 'Ada', lastName: 'Lovelace' },
    { email: 'alan@example.com', role: 'guest', firstName: 'Alan', lastName: 'Turing' },
    { email: 'grace@example.com', role: 'guest', firstName: 'Grace', lastName: 'Hopper' },
  ]);
});

console.log(`Seeded ${stays.length} stays across ${seedWindowDates().length} nights.`);
process.exit(0);
