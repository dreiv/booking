import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { sql } from 'drizzle-orm';
import { fileURLToPath } from 'node:url';
import { schema } from 'utils/db-schema';
import type { Database } from '../src/db/types.ts';

export async function createTestDb(): Promise<Database> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
  });
  return db;
}

export async function resetTestDb(db: Database): Promise<void> {
  await db.execute(sql`TRUNCATE TABLE bookings, idempotency_keys RESTART IDENTITY CASCADE`);
}
