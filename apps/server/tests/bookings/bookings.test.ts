import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '#/app.ts';
import { createTestDb, insertOneOrThrow, resetTestDb } from '../testDb.ts';
import { createCorsOptions } from '#/shared/cors.ts';
import type { Database } from '#/shared/db/types.ts';
import { hotel, roomType, users } from 'utils/db-schema';

let db: Database;
let app: ReturnType<typeof createApp>;
let testHotel: typeof hotel.$inferSelect;
let testRoomType: typeof roomType.$inferSelect;
let testUser: typeof users.$inferSelect;

beforeAll(async () => {
  db = await createTestDb();
  app = createApp(db, createCorsOptions(['http://localhost:3000']));
});

beforeEach(async () => {
  await resetTestDb(db);

  testHotel = await insertOneOrThrow(
    db
      .insert(hotel)
      .values({ name: 'Test Hotel', address: '1 Test St', location: 'Testville' })
      .returning(),
  );
  testRoomType = await insertOneOrThrow(
    db
      .insert(roomType)
      .values({ hotelId: testHotel.hotelId, name: 'Standard', maxOccupancy: 2 })
      .returning(),
  );
  testUser = await insertOneOrThrow(
    db
      .insert(users)
      .values({ email: 'guest@example.com', role: 'guest', firstName: 'Test', lastName: 'Guest' })
      .returning(),
  );
});

describe('Bookings API', () => {
  it('GET /api/bookings returns the mock list', async () => {
    const response = await request(app).get('/api/bookings');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('POST /api/bookings rejects an invalid payload', async () => {
    const response = await request(app).post('/api/bookings').send({});
    expect(response.status).toBe(400);
  });

  it('GET /api/bookings/:id with a malformed id returns JSON 400, not an HTML 500', async () => {
    const response = await request(app).get('/api/bookings/not-a-uuid');
    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toMatch(/json/);
  });

  it('POST /api/bookings rejects an endDate before startDate', async () => {
    const response = await request(app).post('/api/bookings').send({
      hotelId: testHotel.hotelId,
      roomTypeId: testRoomType.roomTypeId,
      userId: testUser.userId,
      guestEmail: 'guest@example.com',
      startDate: '2026-08-05',
      endDate: '2026-08-01',
    });
    expect(response.status).toBe(400);
  });
});
