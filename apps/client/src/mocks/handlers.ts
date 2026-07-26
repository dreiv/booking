import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/bookings', () =>
    HttpResponse.json({
      data: [
        {
          id: 'bkg-1',
          guestName: 'Hello from MSW!',
          roomType: 'suite',
          checkIn: '2026-08-01',
          checkOut: '2026-08-05',
          status: 'confirmed',
          createdAt: '2026-07-01T10:00:00.000Z',
        },
      ],
    }),
  ),
];
