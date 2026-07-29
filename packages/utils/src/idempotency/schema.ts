import { z } from 'zod';

export const idempotencyKeySchema = z
  .string()
  .trim()
  .min(1, 'Idempotency-Key cannot be empty')
  .max(255, 'Idempotency-Key must be 255 characters or fewer');
