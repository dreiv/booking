import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '#/app.ts';
import { createTestDb, insertOneOrThrow, resetTestDb } from '../testDb.ts';
import { createCorsOptions } from '#/shared/cors.ts';
import type { Database } from '#/shared/db/types.ts';
import { booking, hotel, roomType, users } from 'utils/db-schema';

let db: Database;
let app: ReturnType<typeof createApp>;

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
      .values({
        email: 'fixture@example.com',
        role: 'guest',
        firstName: 'Fixture',
        lastName: 'User',
      })
      .returning(),
  );

  await db.insert(booking).values([
    {
      hotelId: testHotel.hotelId,
      roomTypeId: testRoomType.roomTypeId,
      userId: testUser.userId,
      guestEmail: 'ada@example.com',
      guestFirstName: 'Ada',
      guestLastName: 'Lovelace',
      checkIn: '2026-08-01',
      checkOut: '2026-08-05',
    },
    {
      hotelId: testHotel.hotelId,
      roomTypeId: testRoomType.roomTypeId,
      userId: testUser.userId,
      guestEmail: 'alan@example.com',
      guestFirstName: 'Alan',
      guestLastName: 'Turing',
      checkIn: '2026-08-10',
      checkOut: '2026-08-12',
    },
    {
      hotelId: testHotel.hotelId,
      roomTypeId: testRoomType.roomTypeId,
      userId: testUser.userId,
      guestEmail: 'grace@example.com',
      guestFirstName: 'Grace',
      guestLastName: 'Hopper',
      checkIn: '2026-09-01',
      checkOut: '2026-09-03',
    },
  ]);
});

describe('GET /api/bookings query support', () => {
  it('returns pagination meta alongside the data array', async () => {
    const response = await request(app).get('/api/bookings');
    expect(response.body.meta).toEqual({ page: 1, limit: 20, totalRecords: 3, totalPages: 1 });
  });

  it('searches by guest last name, case-insensitively', async () => {
    const response = await request(app).get('/api/bookings').query({ search: 'turing' });
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].guestLastName).toBe('Turing');
  });

  it('rejects an unrecognized filter key', async () => {
    const response = await request(app).get('/api/bookings').query({ rooomType: 'suite' });
    expect(response.status).toBe(400);
  });

  it('rejects duplicate values for the same filter', async () => {
    const response = await request(app)
      .get('/api/bookings')
      .query({ status: ['confirmed', 'cancelled'] });
    expect(response.status).toBe(400);
  });

  it('rejects a request with too many query parameters', async () => {
    const tooManyParams = Object.fromEntries(
      Array.from({ length: 11 }, (_, i) => [`param${i}`, 'x']),
    );
    const response = await request(app).get('/api/bookings').query(tooManyParams);
    expect(response.status).toBe(400);
  });
});
