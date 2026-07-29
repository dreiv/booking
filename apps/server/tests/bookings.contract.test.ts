import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.ts';
import { bookingSchema } from 'utils/booking-schema';
import { createTestDb, resetTestDb } from './testDb.ts';
import { createCorsOptions } from '../src/corsOptions.ts';
import type { Database } from '../src/db/types.ts';

let db: Database;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  db = await createTestDb();
  app = createApp(db, createCorsOptions(['http://localhost:3000']));
});

beforeEach(async () => {
  await resetTestDb(db);
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
      guestName: 'Grace Hopper',
      roomType: 'single',
      checkIn: '2026-09-01',
      checkOut: '2026-09-03',
    });

    const result = bookingSchema.safeParse(response.body);
    expect(result.success).toBe(true);
  });
});
