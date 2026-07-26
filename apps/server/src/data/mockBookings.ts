import type { Booking } from '../schemas/booking.schema.ts';

export const mockBookings: Booking[] = [
  {
    id: 'bkg-1',
    guestName: 'Ada Lovelace',
    roomType: 'suite',
    checkIn: '2026-08-01',
    checkOut: '2026-08-05',
    status: 'confirmed',
    createdAt: '2026-07-01T10:00:00.000Z',
  },
  {
    id: 'bkg-2',
    guestName: 'Alan Turing',
    roomType: 'double',
    checkIn: '2026-08-10',
    checkOut: '2026-08-12',
    status: 'pending',
    createdAt: '2026-07-02T09:30:00.000Z',
  },
];
