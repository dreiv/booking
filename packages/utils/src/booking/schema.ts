import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { bookings, roomTypeEnum, bookingStatusEnum } from '../db/schema.ts';
import { isValidBookingDateRange } from './dates.ts';

extendZodWithOpenApi(z);

export const bookingSchema = createSelectSchema(bookings, {
  checkIn: (schema) => schema.date(),
  checkOut: (schema) => schema.date(),
  createdAt: z.string().datetime(),
})
  .strict()
  .openapi('Booking');

export const createBookingSchema = createInsertSchema(bookings, {
  checkIn: (schema) => schema.date(),
  checkOut: (schema) => schema.date(),
})
  .pick({ guestName: true, roomType: true, checkIn: true, checkOut: true })
  .strict()
  .refine((data) => isValidBookingDateRange(data.checkIn, data.checkOut), {
    message: 'checkOut must be after checkIn',
    path: ['checkOut'],
  })
  .openapi('CreateBookingInput');

export const bookingIdParamSchema = z.string().uuid();

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

export const bookingQuerySchema = z
  .object({
    search: z.string().trim().min(1).optional(),
    roomType: z.enum(roomTypeEnum.enumValues).optional(),
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
