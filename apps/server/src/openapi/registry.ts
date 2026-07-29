import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { bookingSchema, createBookingSchema, bookingIdParamSchema } from 'utils/booking-schema';

const registry = new OpenAPIRegistry();

registry.registerPath({
  method: 'get',
  path: '/api/bookings',
  summary: 'List all bookings',
  responses: {
    200: {
      description: 'A list of bookings',
      content: { 'application/json': { schema: z.object({ data: z.array(bookingSchema) }) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/bookings/{id}',
  summary: 'Get a booking by id',
  request: { params: z.object({ id: bookingIdParamSchema }) },
  responses: {
    200: { description: 'The booking', content: { 'application/json': { schema: bookingSchema } } },
    400: { description: 'Invalid identifier format' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/bookings',
  summary: 'Create a booking',
  request: {
    headers: z.object({
      'idempotency-key': z
        .string()
        .optional()
        .openapi({ description: 'Optional client-generated key to safely retry this request.' }),
    }),
    body: { content: { 'application/json': { schema: createBookingSchema } } },
  },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: bookingSchema } } },
    400: { description: 'Invalid payload' },
    409: {
      description:
        'Idempotency-Key reused with a different payload, or a duplicate request is already in flight',
    },
  },
});

export function generateOpenApiDocument() {
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.0',
    info: { title: 'Booking API', version: '0.0.0' },
  });
}
