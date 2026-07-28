import { z } from 'zod';

try {
  process.loadEnvFile('.env');
} catch (err) {
  const isMissingFile = err instanceof Error && 'code' in err && err.code === 'ENOENT';
  if (!isMissingFile) {
    throw err;
  }
}

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
});

export const env = envSchema.parse(process.env);
