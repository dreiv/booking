import { z } from 'zod';
import {
  bookingSchema,
  createBookingSchema,
  updateBookingSchema,
  bookingIdParamSchema,
  bookingQuerySchema,
  paginatedBookingsSchema,
} from 'utils/booking-schema';
import { problemDetailsSchema } from 'utils/problem-details-schema';
import { registry } from '../shared/openapi.ts';

function problemResponse(description: string) {
  return {
    description,
    content: { 'application/problem+json': { schema: problemDetailsSchema } },
  };
}

registry.registerPath({
  method: 'get',
  path: '/api/v1/bookings',
  summary: 'List bookings — guests see only their own; host/admin see all',
  request: { query: bookingQuerySchema },
  responses: {
    200: {
      description: 'A page of bookings',
      content: { 'application/json': { schema: paginatedBookingsSchema } },
    },
    400: problemResponse('Invalid or excessive query parameters'),
    401: problemResponse('Authentication required'),
    429: problemResponse('Too many requests'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/bookings/{id}',
  summary: 'Get a booking by id — the owning guest, or host/admin',
  request: { params: z.object({ id: bookingIdParamSchema }) },
  responses: {
    200: { description: 'The booking', content: { 'application/json': { schema: bookingSchema } } },
    400: problemResponse('Invalid identifier format'),
    403: problemResponse("Caller does not own this booking and isn't host/admin"),
    404: problemResponse('Not found'),
    429: problemResponse('Too many requests'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/bookings',
  summary: 'Create a booking — guests may only book for themselves',
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
    403: problemResponse('A guest tried to create a booking for a different userId'),
    409: problemResponse(
      'Idempotency-Key reused with a different payload, a duplicate request is already in flight, or no rooms are available for the requested dates',
    ),
    429: problemResponse('Too many requests'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/bookings/{id}',
  summary: "Edit a reservation's dates or room count — the owning guest, or host/admin",
  request: {
    params: z.object({ id: bookingIdParamSchema }),
    body: { content: { 'application/json': { schema: updateBookingSchema } } },
  },
  responses: {
    200: { description: 'Updated', content: { 'application/json': { schema: bookingSchema } } },
    400: problemResponse('Invalid payload, or the booking is cancelled'),
    403: problemResponse("Caller does not own this booking and isn't host/admin"),
    404: problemResponse('Not found'),
    409: problemResponse('No availability for the requested change'),
    429: problemResponse('Too many requests'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/bookings/{id}',
  summary:
    'Cancel a reservation — the owning guest, or host/admin, subject to the cancellation policy',
  request: { params: z.object({ id: bookingIdParamSchema }) },
  responses: {
    200: {
      description: 'Cancelled (or already cancelled)',
      content: { 'application/json': { schema: bookingSchema } },
    },
    400: problemResponse('Too close to check-in to cancel'),
    403: problemResponse("Caller does not own this booking and isn't host/admin"),
    404: problemResponse('Not found'),
    429: problemResponse('Too many requests'),
  },
});
