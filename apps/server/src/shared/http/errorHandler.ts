import type { NextFunction, Request, Response } from 'express';
import { sendProblem } from './problemDetails.ts';

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

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) {
    return;
  }

  // invalid_text_representation — e.g. a malformed UUID reaching a query.
  // A client mistake, not a server fault — no error-level log needed.
  if (getPgErrorCode(err) === '22P02') {
    sendProblem(res, 400, 'Invalid identifier format', req.originalUrl);
    return;
  }

  req.log.error({ err }, 'Unhandled request error');
  sendProblem(res, 500, 'Internal server error', req.originalUrl);
}
