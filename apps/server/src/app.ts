import express from 'express';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import swaggerUi from 'swagger-ui-express';
import pinoHttp from 'pino-http';
import type { Database } from './shared/db/types.ts';
import { createBookingsRouter } from './bookings/bookings.router.ts';
import { createHotelsRouter } from './hotels/hotels.router.ts';
import { createRoomTypesRouter } from './room-types/room-types.router.ts';
import { createSearchRouter } from './search/search.router.ts';
import { authenticate } from './shared/http/auth.ts';
import { generateOpenApiDocument } from './shared/openapi.ts';

// Side-effect imports registering paths into the OpenAPI registry.
import './bookings/bookings.openapi.ts';
import './hotels/hotels.openapi.ts';
import './room-types/room-types.openapi.ts';
import './search/search.openapi.ts';
import { errorHandler } from './shared/http/errorHandler.ts';
import { logger } from './logger.ts';

const API_PREFIX = '/api/v1';

export function createApp(db: Database, corsOptions: CorsOptions, trustProxy = false) {
  const app = express();
  if (trustProxy) app.set('trust proxy', 1);
  app.use(pinoHttp({ logger, autoLogging: false }));
  app.use(cors(corsOptions));
  app.use(express.json());
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  app.use(authenticate);

  app.use(`${API_PREFIX}/bookings`, createBookingsRouter(db));
  // Mounted before /hotels to ensure nested route resolution takes precedence.
  app.use(`${API_PREFIX}/hotels/:hotelId/room-types`, createRoomTypesRouter(db));
  app.use(`${API_PREFIX}/hotels`, createHotelsRouter(db));
  app.use(`${API_PREFIX}/search`, createSearchRouter(db));

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(generateOpenApiDocument()));
  app.use(errorHandler);
  return app;
}
