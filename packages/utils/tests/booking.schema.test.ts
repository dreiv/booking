import { expect, test } from 'vite-plus/test';
import { bookingQuerySchema } from '../src/schemas/booking.schema.ts';

test('applies default sort, order, page, and limit', () => {
  const result = bookingQuerySchema.parse({});
  expect(result).toEqual({ sortBy: 'createdAt', order: 'desc', page: 1, limit: 20 });
});

test('coerces page and limit from query string values', () => {
  const result = bookingQuerySchema.parse({ page: '2', limit: '5' });
  expect(result.page).toBe(2);
  expect(result.limit).toBe(5);
});

test('rejects a limit above the maximum', () => {
  expect(bookingQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
});

test('rejects an unrecognized query key', () => {
  expect(bookingQuerySchema.safeParse({ rooomType: 'single' }).success).toBe(false);
});

test('rejects an invalid roomType value', () => {
  expect(bookingQuerySchema.safeParse({ roomType: 'penthouse' }).success).toBe(false);
});
