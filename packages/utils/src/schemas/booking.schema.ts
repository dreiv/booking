import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { bookings } from '../db/schema.ts';
import { isValidBookingDateRange } from '../validation/bookingDates.ts';

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
