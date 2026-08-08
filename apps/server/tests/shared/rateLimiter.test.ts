import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '#/app.ts';
import { createTestDb, resetTestDb, insertOneOrThrow, seedInventory } from '../testDb.ts';
import { createCorsOptions } from '#/shared/cors.ts';
import type { Database } from '#/shared/db/types.ts';
import { hotel, roomType, users } from 'utils/db-schema';

let db: Database;
let app: ReturnType<typeof createApp>;
let validPayload: {
  hotelId: number;
  roomTypeId: number;
  userId: number;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
};

beforeAll(async () => {
  db = await createTestDb();
  app = createApp(db, createCorsOptions(['http://localhost:3000']));
});

beforeEach(async () => {
  await resetTestDb(db);

  const testHotel = await insertOneOrThrow(
    db
      .insert(hotel)
      .values({ name: 'Test Hotel', address: '1 Test St', location: 'Testville' })
      .returning(),
  );
  const testRoomType = await insertOneOrThrow(
    db
      .insert(roomType)
      .values({ hotelId: testHotel.hotelId, name: 'Standard', maxOccupancy: 2 })
      .returning(),
  );
  const testUser = await insertOneOrThrow(
    db
      .insert(users)
      .values({ email: 'rate@example.com', role: 'guest', firstName: 'Rate', lastName: 'Limit' })
      .returning(),
  );

  validPayload = {
    hotelId: testHotel.hotelId,
    roomTypeId: testRoomType.roomTypeId,
    userId: testUser.userId,
    guestEmail: 'rate@example.com',
    checkIn: '2026-11-01',
    checkOut: '2026-11-03',
  };

  await seedInventory(db, {
    hotelId: testHotel.hotelId,
    roomTypeId: testRoomType.roomTypeId,
    checkIn: validPayload.checkIn,
    checkOut: validPayload.checkOut,
    totalInventory: 20,
  });
});

describe('Rate limiting', () => {
  it('includes RateLimit headers on a normal request', async () => {
    const response = await request(app)
      .get('/api/v1/bookings')
      .set('x-user-id', String(validPayload.userId));
    expect(response.headers['ratelimit-limit']).toBeDefined();
  });

  it('returns 429 after exceeding the write limit', async () => {
    for (let i = 0; i < 10; i++) {
      const response = await request(app)
        .post('/api/v1/bookings')
        .set('x-user-id', String(validPayload.userId))
        .send(validPayload);
      expect(response.status).toBe(201);
    }

    const blocked = await request(app)
      .post('/api/v1/bookings')
      .set('x-user-id', String(validPayload.userId))
      .send(validPayload);
    expect(blocked.status).toBe(429);
  });
});
