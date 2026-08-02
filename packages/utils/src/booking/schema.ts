import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { booking, bookingStatusEnum } from '../db/schema.ts';
import { isValidBookingDateRange } from './dates.ts';

extendZodWithOpenApi(z);

export const bookingSchema = createSelectSchema(booking, {
  startDate: (schema) => schema.date(),
  endDate: (schema) => schema.date(),
  createdAt: z.string().datetime(),
})
  .strict()
  .openapi('Booking');

export const createBookingSchema = createInsertSchema(booking, {
  startDate: (schema) => schema.date(),
  endDate: (schema) => schema.date(),
})
  .pick({
    hotelId: true,
    roomTypeId: true,
    userId: true,
    guestEmail: true,
    guestFirstName: true,
    guestLastName: true,
    startDate: true,
    endDate: true,
    roomCount: true,
  })
  .strict()
  .refine((data) => isValidBookingDateRange(data.startDate, data.endDate), {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  })
  .refine((data) => data.userId != null && data.guestEmail != null, {
    message: 'Both userId and guestEmail are required',
    path: ['userId'],
  })
  .openapi('CreateBookingInput');

export const bookingIdParamSchema = z.string().uuid();

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

export const bookingQuerySchema = z
  .object({
    search: z.string().trim().min(1).optional(),
    status: z.enum(bookingStatusEnum.enumValues).optional(),
    sortBy: z.enum(['startDate', 'endDate', 'createdAt']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT),
  })
  .strict()
  .openapi('BookingQuery');

export const paginatedBookingsSchema = z
  .object({
    data: bookingSchema.array(),
    meta: z.object({
      page: z.number(),
      limit: z.number(),
      totalRecords: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi('PaginatedBookingsResponse');
