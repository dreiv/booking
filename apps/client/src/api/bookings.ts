import { z } from 'zod';
import { bookingSchema, createBookingSchema } from 'utils/booking-schema';

export type Booking = z.infer<typeof bookingSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

const bookingsResponseSchema = z.object({ data: bookingSchema.array() });

export async function fetchBookings(): Promise<Booking[]> {
  const res = await fetch('/api/bookings');
  if (!res.ok) {
    throw new Error(`Failed to fetch bookings: ${res.status}`);
  }
  const body: unknown = await res.json();
  const result = bookingsResponseSchema.safeParse(body);
  if (!result.success) {
    throw new Error(`Received malformed bookings response: ${result.error.message}`);
  }
  return result.data.data;
}

/**
 * Creates a booking. Sends a fresh Idempotency-Key with every call so a dropped
 * response or an accidental double-submit safely retries instead of creating
 * a duplicate booking.
 */
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`Failed to create booking: ${res.status}`);
  }
  const body: unknown = await res.json();
  const result = bookingSchema.safeParse(body);
  if (!result.success) {
    throw new Error(`Received malformed booking response: ${result.error.message}`);
  }
  return result.data;
}
