import { createApp } from './app.ts';
import { db } from './shared/db/client.ts';
import { env } from './env.ts';
import { resolveAllowedOrigins, createCorsOptions } from './shared/cors.ts';
import { logger } from './logger.ts';

const allowedOrigins = resolveAllowedOrigins(env.CORS_ALLOWED_ORIGINS, env.NODE_ENV);
const corsOptions = createCorsOptions(allowedOrigins);

const app = createApp(db, corsOptions, env.TRUST_PROXY);

app.listen(env.PORT, () => {
  logger.info(`Server running at http://localhost:${env.PORT}`);
});
