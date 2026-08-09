import { z } from 'zod';
import { bookingSchema, createBookingSchema, bookingQuerySchema } from 'utils/booking-schema';
import { problemDetailsSchema } from 'utils/problem-details-schema';
import { useSessionStore } from '#/core/stores/useSessionStore';

export type Booking = z.infer<typeof bookingSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingQuery = Partial<z.infer<typeof bookingQuerySchema>>;

const paginatedBookingsSchema = z.object({
  data: bookingSchema.array(),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalRecords: z.number(),
    totalPages: z.number(),
  }),
});

export type PaginatedBookings = z.infer<typeof paginatedBookingsSchema>;

// Extracts error details from problem+json body or falls back to status code.
async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json();
    const problem = problemDetailsSchema.safeParse(body);
    if (problem.success) return problem.data.detail;
  } catch {
    // Non-JSON response
  }
  return `Request failed with status ${res.status}`;
}

export async function fetchBookings(query: BookingQuery = {}): Promise<PaginatedBookings> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();

  const res = await fetch(`/api/v1/bookings${qs ? `?${qs}` : ''}`, {
    headers: useSessionStore().authHeaders(),
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
  }
  const body: unknown = await res.json();
  const result = paginatedBookingsSchema.safeParse(body);
  if (!result.success) {
    throw new Error(`Received malformed bookings response: ${result.error.message}`);
  }
  return result.data;
}

// Creates a booking using an idempotency key to prevent duplicate creation.
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const headers = new Headers(useSessionStore().authHeaders());
  headers.set('Content-Type', 'application/json');
  headers.set('Idempotency-Key', crypto.randomUUID());

  const res = await fetch('/api/v1/bookings', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
  }
  const body: unknown = await res.json();
  const result = bookingSchema.safeParse(body);
  if (!result.success) {
    throw new Error(`Received malformed booking response: ${result.error.message}`);
  }
  return result.data;
}
