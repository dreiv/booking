import { defineConfig } from 'drizzle-kit';
import { env } from './src/env.ts';

export default defineConfig({
  schema: '../../packages/utils/src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: env.DATABASE_URL },
});
