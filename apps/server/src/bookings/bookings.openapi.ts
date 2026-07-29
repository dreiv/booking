import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  bookingSchema,
  createBookingSchema,
  bookingIdParamSchema,
  bookingQuerySchema,
  paginatedBookingsSchema,
} from 'utils/booking-schema';
import { problemDetailsSchema } from 'utils/problem-details-schema';

const registry = new OpenAPIRegistry();

function problemResponse(description: string) {
  return {
    description,
    content: { 'application/problem+json': { schema: problemDetailsSchema } },
  };
}

registry.registerPath({
  method: 'get',
  path: '/api/bookings',
  summary: 'List bookings with optional search, filters, sorting, and pagination',
  request: { query: bookingQuerySchema },
  responses: {
    200: {
      description: 'A page of bookings',
      content: { 'application/json': { schema: paginatedBookingsSchema } },
    },
    400: problemResponse('Invalid or excessive query parameters'),
    429: problemResponse('Too many requests'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/bookings/{id}',
  summary: 'Get a booking by id',
  request: { params: z.object({ id: bookingIdParamSchema }) },
  responses: {
    200: { description: 'The booking', content: { 'application/json': { schema: bookingSchema } } },
    400: problemResponse('Invalid identifier format'),
    404: problemResponse('Not found'),
    429: problemResponse('Too many requests'),
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
    400: problemResponse('Invalid payload'),
    409: problemResponse(
      'Idempotency-Key reused with a different payload, or a duplicate request is already in flight',
    ),
    429: problemResponse('Too many requests'),
  },
});

export function generateOpenApiDocument() {
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.0',
    info: { title: 'Booking API', version: '0.0.0' },
  });
}
