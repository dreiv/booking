import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { booking, bookingStatusEnum } from '../db/schema.ts';
import { isValidBookingDateRange } from './dates.ts';

// Re-export date utilities for consumer convenience.
export * from './dates.ts';

extendZodWithOpenApi(z);

export const bookingSchema = createSelectSchema(booking, {
  checkIn: (schema) => schema.date(),
  checkOut: (schema) => schema.date(),
  createdAt: z.string().datetime(),
})
  .strict()
  .openapi('Booking');

export const createBookingSchema = createInsertSchema(booking, {
  checkIn: (schema) => schema.date(),
  checkOut: (schema) => schema.date(),
})
  .pick({
    hotelId: true,
    roomTypeId: true,
    userId: true,
    guestEmail: true,
    guestFirstName: true,
    guestLastName: true,
    checkIn: true,
    checkOut: true,
    roomCount: true,
  })
  .strict()
  .refine((data) => isValidBookingDateRange(data.checkIn, data.checkOut), {
    message: 'checkOut must be after checkIn',
    path: ['checkOut'],
  })
  .refine((data) => data.userId != null && data.guestEmail != null, {
    message: 'Both userId and guestEmail are required',
    path: ['userId'],
  })
  .openapi('CreateBookingInput');

// Only inventory-impacting fields are updateable.
export const updateBookingSchema = createInsertSchema(booking, {
  checkIn: (schema) => schema.date(),
  checkOut: (schema) => schema.date(),
})
  .pick({
    checkIn: true,
    checkOut: true,
    roomCount: true,
  })
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })
  .refine(
    (data) =>
      data.checkIn === undefined ||
      data.checkOut === undefined ||
      isValidBookingDateRange(data.checkIn, data.checkOut),
    { message: 'checkOut must be after checkIn', path: ['checkOut'] },
  )
  .openapi('UpdateBookingInput');

export const bookingIdParamSchema = z.string().uuid();

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

export const bookingQuerySchema = z
  .object({
    search: z.string().trim().min(1).optional(),
    status: z.enum(bookingStatusEnum.enumValues).optional(),
    sortBy: z.enum(['checkIn', 'checkOut', 'createdAt']).default('createdAt'),
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
