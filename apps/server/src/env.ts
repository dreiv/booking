import { z } from 'zod';

try {
  process.loadEnvFile('.env');
} catch (err) {
  const isMissingFile = err instanceof Error && 'code' in err && err.code === 'ENOENT';
  if (!isMissingFile) {
    throw err;
  }
  // No .env file present — assume the host (Render, Neon, CI, etc.)
  // injects environment variables directly into process.env instead.
}

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
});

export const env = envSchema.parse(process.env);
