import type { NextFunction, Request, Response } from 'express';

interface PgError {
  code?: string;
}

function isPgError(err: unknown): err is PgError {
  return typeof err === 'object' && err !== null && 'code' in err;
}

function getPgErrorCode(err: unknown): string | undefined {
  if (isPgError(err) && typeof err.code === 'string') {
    return err.code;
  }
  if (err instanceof Error && isPgError(err.cause) && typeof err.cause.code === 'string') {
    return err.cause.code;
  }
  return undefined;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) {
    return;
  }

  // invalid_text_representation — e.g. a malformed UUID reaching a query.
  // A client mistake, not a server fault — no error-level log needed.
  if (getPgErrorCode(err) === '22P02') {
    res.status(400).json({ error: 'Invalid identifier format' });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
