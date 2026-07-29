import { createApp } from './app.ts';
import { db } from './db/client.ts';
import { env } from './env.ts';
import { resolveAllowedOrigins, createCorsOptions } from './corsOptions.ts';
import { logger } from './logger.ts';

const allowedOrigins = resolveAllowedOrigins(env.CORS_ALLOWED_ORIGINS, env.NODE_ENV);
const corsOptions = createCorsOptions(allowedOrigins);

const app = createApp(db, corsOptions, env.TRUST_PROXY);

app.listen(env.PORT, () => {
  logger.info(`Server running at http://localhost:${env.PORT}`);
});
