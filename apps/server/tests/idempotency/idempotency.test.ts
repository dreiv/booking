import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '#/app.ts';
import { createTestDb, resetTestDb, insertOneOrThrow } from '../testDb.ts';
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
      .values({
        email: 'idem@example.com',
        role: 'guest',
        firstName: 'Idempotency',
        lastName: 'Guest',
      })
      .returning(),
  );

  validPayload = {
    hotelId: testHotel.hotelId,
    roomTypeId: testRoomType.roomTypeId,
    userId: testUser.userId,
    guestEmail: 'idem@example.com',
    checkIn: '2026-10-01',
    checkOut: '2026-10-03',
  };
});

describe('Idempotency-Key handling on POST /api/bookings', () => {
  it('creates a booking normally when no key is sent', async () => {
    const response = await request(app).post('/api/bookings').send(validPayload);
    expect(response.status).toBe(201);
  });

  it('replays the cached response when the same key and payload are repeated', async () => {
    const key = 'idem-key-1';

    const first = await request(app)
      .post('/api/bookings')
      .set('Idempotency-Key', key)
      .send(validPayload);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/bookings')
      .set('Idempotency-Key', key)
      .send(validPayload);

    expect(second.status).toBe(201);
    expect(second.body.bookingId).toBe(first.body.bookingId);
    expect(second.headers['idempotency-replayed']).toBe('true');

    const all = await request(app).get('/api/bookings');
    expect(all.body.data).toHaveLength(1);
  });

  it('rejects reuse of the same key with a different payload', async () => {
    const key = 'idem-key-2';

    await request(app).post('/api/bookings').set('Idempotency-Key', key).send(validPayload);

    const conflict = await request(app)
      .post('/api/bookings')
      .set('Idempotency-Key', key)
      .send({ ...validPayload, guestEmail: 'someone-else@example.com' });

    expect(conflict.status).toBe(409);
  });

  it('rejects a key that exceeds the maximum length', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .set('Idempotency-Key', 'a'.repeat(256))
      .send(validPayload);

    expect(response.status).toBe(400);
  });
});
