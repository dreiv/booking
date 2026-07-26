import { z } from 'zod';

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
  .strict();

export const createBookingSchema = bookingSchema.omit({
  id: true,
  status: true,
  createdAt: true,
});

export type Booking = z.infer<typeof bookingSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
