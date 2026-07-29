import { expect, test } from 'vite-plus/test';
import { idempotencyKeySchema } from '#/idempotency/schema.ts';

test('accepts a reasonable idempotency key', () => {
  expect(idempotencyKeySchema.safeParse('a1b2c3').success).toBe(true);
});

test('trims surrounding whitespace', () => {
  expect(idempotencyKeySchema.parse('  key-1  ')).toBe('key-1');
});

test('rejects an empty key', () => {
  expect(idempotencyKeySchema.safeParse('').success).toBe(false);
});

test('rejects a key over 255 characters', () => {
  expect(idempotencyKeySchema.safeParse('a'.repeat(256)).success).toBe(false);
});
