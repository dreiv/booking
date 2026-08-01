import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '#/app.ts';
import { createTestDb, resetTestDb } from '../testDb.ts';
import { createCorsOptions } from '#/shared/cors.ts';
import type { Database } from '#/shared/db/types.ts';

let db: Database;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  db = await createTestDb();
  app = createApp(db, createCorsOptions(['http://localhost:3000']));
});

beforeEach(async () => {
  await resetTestDb(db);
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

  it('POST /api/bookings rejects a checkOut date before checkIn', async () => {
    const response = await request(app).post('/api/bookings').send({
      guestName: 'Test Guest',
      checkIn: '2026-08-05',
      checkOut: '2026-08-01',
    });
    expect(response.status).toBe(400);
  });
});
