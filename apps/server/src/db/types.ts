import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import type { schema } from 'utils/db-schema';

export type Database = NodePgDatabase<typeof schema> | PgliteDatabase<typeof schema>;
