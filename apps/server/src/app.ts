import express from 'express';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import swaggerUi from 'swagger-ui-express';
import type { Database } from './db/types.ts';
import { createBookingsRouter } from './routes/bookings.ts';
import { generateOpenApiDocument } from './openapi/registry.ts';
import { errorHandler } from './middleware/errorHandler.ts';

export function createApp(db: Database, corsOptions: CorsOptions) {
  const app = express();
  app.use(cors(corsOptions));
  app.use(express.json());
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
  app.use('/api/bookings', createBookingsRouter(db));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(generateOpenApiDocument()));
  app.use(errorHandler);
  return app;
}
