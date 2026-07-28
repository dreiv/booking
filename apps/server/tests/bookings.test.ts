import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.ts';
import { beforeEach } from 'vitest';
import { createTestDb } from './testDb.ts';

let app: ReturnType<typeof createApp>;

beforeEach(async () => {
  app = createApp(await createTestDb());
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
});
