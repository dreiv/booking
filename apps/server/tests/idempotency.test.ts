import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.ts';
import { createTestDb } from './testDb.ts';
import { createCorsOptions } from '../src/corsOptions.ts';

let app: ReturnType<typeof createApp>;

beforeEach(async () => {
  app = createApp(await createTestDb(), createCorsOptions(['http://localhost:3000']));
});

const validPayload = {
  guestName: 'Idempotency Guest',
  roomType: 'single',
  checkIn: '2026-10-01',
  checkOut: '2026-10-03',
};

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
    expect(second.body.id).toBe(first.body.id);
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
      .send({ ...validPayload, guestName: 'Someone Else' });

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
