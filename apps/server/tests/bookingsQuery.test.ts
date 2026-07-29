import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.ts';
import { createTestDb, resetTestDb } from './testDb.ts';
import { createCorsOptions } from '../src/corsOptions.ts';
import type { Database } from '../src/db/types.ts';
import { bookings } from 'utils/db-schema';

let db: Database;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  db = await createTestDb();
  app = createApp(db, createCorsOptions(['http://localhost:3000']));
});

beforeEach(async () => {
  await resetTestDb(db);
  await db.insert(bookings).values([
    { guestName: 'Ada Lovelace', roomType: 'suite', checkIn: '2026-08-01', checkOut: '2026-08-05' },
    { guestName: 'Alan Turing', roomType: 'double', checkIn: '2026-08-10', checkOut: '2026-08-12' },
    {
      guestName: 'Grace Hopper',
      roomType: 'single',
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

  it('filters by roomType', async () => {
    const response = await request(app).get('/api/bookings').query({ roomType: 'suite' });
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].guestName).toBe('Ada Lovelace');
  });

  it('searches by guest name, case-insensitively', async () => {
    const response = await request(app).get('/api/bookings').query({ search: 'turing' });
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].guestName).toBe('Alan Turing');
  });

  it('rejects an unrecognized filter key', async () => {
    const response = await request(app).get('/api/bookings').query({ rooomType: 'suite' });
    expect(response.status).toBe(400);
  });

  it('rejects duplicate values for the same filter', async () => {
    const response = await request(app)
      .get('/api/bookings')
      .query({ roomType: ['single', 'suite'] });
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
