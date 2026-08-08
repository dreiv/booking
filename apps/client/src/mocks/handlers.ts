import { http, HttpResponse } from 'msw';

const mockBooking = {
  bookingId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  hotelId: 1,
  roomTypeId: 1,
  userId: 1,
  guestEmail: 'hello@example.com',
  guestFirstName: 'Hello',
  guestLastName: 'from MSW!',
  checkIn: '2026-08-01',
  checkOut: '2026-08-05',
  status: 'confirmed',
  roomCount: 1,
  expiresAt: null,
  createdAt: '2026-07-01T10:00:00.000Z',
};

export const handlers = [
  http.get('/api/v1/bookings', () =>
    HttpResponse.json({
      data: [mockBooking],
      meta: { page: 1, limit: 20, totalRecords: 1, totalPages: 1 },
    }),
  ),

  http.post('/api/v1/bookings', async ({ request }) => {
    const input = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        ...mockBooking,
        bookingId: crypto.randomUUID(),
        status: 'held',
        roomCount: 1,
        expiresAt: null,
        createdAt: new Date().toISOString(),
        ...input,
      },
      { status: 201 },
    );
  }),
];
