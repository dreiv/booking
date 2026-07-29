import { expect, test } from 'vite-plus/test';
import { isValidBookingDateRange } from '../../src/booking/dates.ts';

test('accepts a checkOut date after checkIn', () => {
  expect(isValidBookingDateRange('2026-08-01', '2026-08-05')).toBe(true);
});

test('rejects a checkOut date equal to checkIn', () => {
  expect(isValidBookingDateRange('2026-08-01', '2026-08-01')).toBe(false);
});

test('rejects a checkOut date before checkIn', () => {
  expect(isValidBookingDateRange('2026-08-05', '2026-08-01')).toBe(false);
});
