import express from 'express';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import swaggerUi from 'swagger-ui-express';
import pinoHttp from 'pino-http';
import type { Database } from './shared/db/types.ts';
import { createBookingsRouter } from './bookings/bookings.router.ts';
import { generateOpenApiDocument } from './bookings/bookings.openapi.ts';
import { errorHandler } from './shared/http/errorHandler.ts';
import { logger } from './logger.ts';

export function createApp(db: Database, corsOptions: CorsOptions, trustProxy = false) {
  const app = express();
  if (trustProxy) app.set('trust proxy', 1);
  app.use(pinoHttp({ logger, autoLogging: false }));
  app.use(cors(corsOptions));
  app.use(express.json());
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
  app.use('/api/bookings', createBookingsRouter(db));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(generateOpenApiDocument()));
  app.use(errorHandler);
  return app;
}
