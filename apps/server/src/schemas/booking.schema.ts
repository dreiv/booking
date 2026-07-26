import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const bookingSchema = z
  .object({
    id: z.string(),
    guestName: z.string().min(1),
    roomType: z.enum(['single', 'double', 'suite']),
    checkIn: z.string().date(),
    checkOut: z.string().date(),
    status: z.enum(['pending', 'confirmed', 'cancelled']),
    createdAt: z.string().datetime(),
  })
  .strict()
  .openapi('Booking');

export const createBookingSchema = bookingSchema
  .omit({ id: true, status: true, createdAt: true })
  .openapi('CreateBookingInput');
