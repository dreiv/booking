import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { idempotencyKeys } from 'utils/db-schema';
import { createTestDb, resetTestDb } from '../testDb.ts';
import type { Database } from '../../src/shared/db/types.ts';

let db: Database;

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  await resetTestDb(db);
});

describe('prune_expired_idempotency_keys_now', () => {
  it('deletes expired keys but leaves recent ones alone', async () => {
    const expiredKey = 'expired-key';
    const freshKey = 'fresh-key';
    const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25h ago
    const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1h ago

    await db.insert(idempotencyKeys).values([
      { key: expiredKey, requestPath: '/api/bookings', requestHash: 'a', createdAt: oldDate },
      { key: freshKey, requestPath: '/api/bookings', requestHash: 'b', createdAt: recentDate },
    ]);

    await db.execute(sql`SELECT prune_expired_idempotency_keys_now()`);

    const remainingKeys = (await db.select().from(idempotencyKeys)).map((row) => row.key);

    expect(remainingKeys).not.toContain(expiredKey);
    expect(remainingKeys).toContain(freshKey);
  });

  it('never deletes the excluded key, even if it is expired', async () => {
    const key = 'currently-inserting-key';
    const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000);

    await db.insert(idempotencyKeys).values({
      key,
      requestPath: '/api/bookings',
      requestHash: 'a',
      createdAt: oldDate,
    });

    await db.execute(sql`SELECT prune_expired_idempotency_keys_now(${key})`);

    const [remaining] = await db.select().from(idempotencyKeys).where(eq(idempotencyKeys.key, key));

    expect(remaining).toBeDefined();
  });
});
