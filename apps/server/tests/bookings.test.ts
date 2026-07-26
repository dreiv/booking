import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.ts';

const app = createApp();

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
});
