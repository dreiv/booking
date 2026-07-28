import type { CorsOptions } from 'cors';

export function resolveAllowedOrigins(rawOrigins: string | undefined, nodeEnv: string): string[] {
  const origins = rawOrigins
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (nodeEnv === 'production' && (!origins || origins.length === 0)) {
    throw new Error(
      'CORS_ALLOWED_ORIGINS must be set in production — refusing to start with an unrestricted CORS policy.',
    );
  }

  return origins && origins.length > 0 ? origins : ['http://localhost:5173'];
}

export function createCorsOptions(allowedOrigins: string[]): CorsOptions {
  return { origin: allowedOrigins };
}
