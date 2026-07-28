import { z } from 'zod';
import { bookingSchema } from 'utils/booking-schema';

export type Booking = z.infer<typeof bookingSchema>;

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
