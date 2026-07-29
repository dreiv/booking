import { describe, it, expect } from 'vitest';
import { resolveAllowedOrigins } from '../../src/shared/cors.ts';

describe('resolveAllowedOrigins', () => {
  it('parses a comma-separated list of origins', () => {
    expect(resolveAllowedOrigins('https://a.com, https://b.com', 'development')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });

  it('falls back to the local client dev origin when unset outside production', () => {
    expect(resolveAllowedOrigins(undefined, 'development')).toEqual(['http://localhost:5173']);
  });

  it('throws when unset in production', () => {
    expect(() => resolveAllowedOrigins(undefined, 'production')).toThrow();
  });
});
