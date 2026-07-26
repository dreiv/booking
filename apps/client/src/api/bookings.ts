import type { components } from 'utils/api-types';

type Booking = components['schemas']['Booking'];

export async function fetchBookings(): Promise<Booking[]> {
  const res = await fetch('/api/bookings');
  if (!res.ok) {
    throw new Error(`Failed to fetch bookings: ${res.status}`);
  }
  const body = await res.json();
  return body.data;
}
