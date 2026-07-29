import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.ts';
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

const validPayload = {
  guestName: 'Rate Limit Guest',
  roomType: 'single',
  checkIn: '2026-11-01',
  checkOut: '2026-11-03',
};

describe('Rate limiting', () => {
  it('includes RateLimit headers on a normal request', async () => {
    const response = await request(app).get('/api/bookings');
    expect(response.headers['ratelimit-limit']).toBeDefined();
  });

  it('returns 429 after exceeding the write limit', async () => {
    for (let i = 0; i < 10; i++) {
      const response = await request(app).post('/api/bookings').send(validPayload);
      expect(response.status).toBe(201);
    }

    const blocked = await request(app).post('/api/bookings').send(validPayload);
    expect(blocked.status).toBe(429);
  });
});
