import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { bookingsRouter } from './routes/bookings.ts';
import { generateOpenApiDocument } from './openapi/registry.ts';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/bookings', bookingsRouter);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(generateOpenApiDocument()));
  return app;
}
