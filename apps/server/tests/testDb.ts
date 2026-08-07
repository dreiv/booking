import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { drizzle } from 'drizzle-orm/pglite';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { schema } from 'utils/db-schema';
import type { Database } from '../src/shared/db/types.ts';

const MIGRATIONS_DIR = fileURLToPath(new URL('../drizzle', import.meta.url));

// pg_cron needs a real background worker process, which PGlite can't provide.
// Skipped in tests — the pruning functions themselves are still testable directly.
const SKIP_IN_TESTS = ['pg_cron_pruning'];

async function applyMigrations(client: PGlite) {
  const journal = JSON.parse(
    readFileSync(path.join(MIGRATIONS_DIR, 'meta/_journal.json'), 'utf-8'),
  );

  for (const entry of journal.entries) {
    if (SKIP_IN_TESTS.some((skip) => entry.tag.includes(skip))) continue;

    const fileContent = readFileSync(path.join(MIGRATIONS_DIR, `${entry.tag}.sql`), 'utf-8');
    for (const statement of fileContent.split('--> statement-breakpoint')) {
      if (statement.trim()) await client.exec(statement);
    }
  }
}

export async function createTestDb(): Promise<Database> {
  const client = new PGlite({ extensions: { pg_trgm } });
  await applyMigrations(client);
  return drizzle(client, { schema });
}

export async function resetTestDb(db: Database): Promise<void> {
  await db.execute(
    sql`TRUNCATE TABLE booking, room_type_inventory, room_type_rate, room, room_type, hotel, users, idempotency_keys RESTART IDENTITY CASCADE`,
  );
}

export async function insertOneOrThrow<T>(rows: Promise<T[]>): Promise<T> {
  const [first] = await rows;
  if (!first) throw new Error('Expected insert to return at least one row, got none');
  return first;
}
