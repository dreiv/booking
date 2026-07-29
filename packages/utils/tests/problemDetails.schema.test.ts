import { expect, test } from 'vite-plus/test';
import { problemDetailsSchema } from '../src/schemas/problemDetails.schema.ts';

test('accepts a well-formed problem details object', () => {
  const result = problemDetailsSchema.safeParse({
    type: 'about:blank',
    title: 'Bad Request',
    status: 400,
    detail: 'Invalid identifier format',
    instance: '/api/bookings/not-a-uuid',
  });
  expect(result.success).toBe(true);
});

test('rejects a missing detail field', () => {
  const result = problemDetailsSchema.safeParse({
    type: 'about:blank',
    title: 'Bad Request',
    status: 400,
    instance: '/api/bookings/not-a-uuid',
  });
  expect(result.success).toBe(false);
});

test('rejects unknown extension fields', () => {
  const result = problemDetailsSchema.safeParse({
    type: 'about:blank',
    title: 'Bad Request',
    status: 400,
    detail: 'Invalid identifier format',
    instance: '/api/bookings/not-a-uuid',
    invalidParams: [],
  });
  expect(result.success).toBe(false);
});
