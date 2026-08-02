import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/bookings', () =>
    HttpResponse.json({
      data: [
        {
          id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          guestName: 'Hello from MSW!',
          checkIn: '2026-08-01',
          checkOut: '2026-08-05',
          status: 'confirmed',
          createdAt: '2026-07-01T10:00:00.000Z',
        },
      ],
    }),
  ),
];
