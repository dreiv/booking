import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/bookings', () =>
    HttpResponse.json({
      data: [
        {
          bookingId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          hotelId: 1,
          roomTypeId: 1,
          userId: 1,
          guestEmail: 'hello@example.com',
          guestFirstName: 'Hello',
          guestLastName: 'from MSW!',
          startDate: '2026-08-01',
          endDate: '2026-08-05',
          status: 'confirmed',
          roomCount: 1,
          expiresAt: null,
          createdAt: '2026-07-01T10:00:00.000Z',
        },
      ],
    }),
  ),
];
