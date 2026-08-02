import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '#/app.ts';
import { bookingSchema } from 'utils/booking-schema';
import { problemDetailsSchema } from 'utils/problem-details-schema';
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

describe('Bookings API contract', () => {
  it('GET /api/bookings response items conform to bookingSchema', async () => {
    const response = await request(app).get('/api/bookings');

    const listSchema = bookingSchema.array();
    const result = listSchema.safeParse(response.body.data);

    expect(result.success).toBe(true);
  });

  it('POST /api/bookings response conforms to bookingSchema', async () => {
    const response = await request(app).post('/api/bookings').send({
      hotelId: testHotel.hotelId,
      roomTypeId: testRoomType.roomTypeId,
      userId: testUser.userId,
      guestEmail: 'guest@example.com',
      checkIn: '2026-09-01',
      checkOut: '2026-09-03',
    });

    const result = bookingSchema.safeParse(response.body);
    expect(result.success).toBe(true);
  });

  it('GET /api/bookings/:id with a malformed id conforms to problemDetailsSchema', async () => {
    const response = await request(app).get('/api/bookings/not-a-uuid');

    expect(response.headers['content-type']).toMatch(/application\/problem\+json/);
    const result = problemDetailsSchema.safeParse(response.body);
    expect(result.success).toBe(true);
  });

  it('GET /api/bookings/:id with a nonexistent id conforms to problemDetailsSchema', async () => {
    const response = await request(app).get('/api/bookings/00000000-0000-0000-0000-000000000000');

    const result = problemDetailsSchema.safeParse(response.body);
    expect(result.success).toBe(true);
  });

  it('POST /api/bookings with an invalid payload conforms to problemDetailsSchema', async () => {
    const response = await request(app).post('/api/bookings').send({});

    const result = problemDetailsSchema.safeParse(response.body);
    expect(result.success).toBe(true);
  });
});
