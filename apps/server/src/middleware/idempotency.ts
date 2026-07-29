import type { NextFunction, Request, Response } from 'express';
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Logger } from 'pino';
import type { Database } from '../db/types.ts';
import { idempotencyKeys } from 'utils/db-schema';
import { idempotencyKeySchema } from 'utils/idempotency-schema';
import { sendProblem } from '../utils/problemDetails.ts';

const IDEMPOTENCY_KEY_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface PgError {
  code?: string;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' && err !== null && 'code' in err && (err as PgError).code === '23505'
  );
}

function hashRequestBody(body: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(body ?? {}))
    .digest('hex');
}

async function persistResponse(
  db: Database,
  log: Logger,
  key: string,
  status: number,
  body: unknown,
) {
  try {
    if (status >= 200 && status < 300) {
      await db
        .update(idempotencyKeys)
        .set({ responseStatus: status, responseBody: body })
        .where(eq(idempotencyKeys.key, key));
    } else {
      // Don't cache failed attempts — let the client retry with the same key.
      await db.delete(idempotencyKeys).where(eq(idempotencyKeys.key, key));
    }
  } catch (err) {
    log.error({ err, key }, 'Failed to persist idempotency record');
  }
}

export function createIdempotencyMiddleware(db: Database) {
  return async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
    const rawKey = req.header('Idempotency-Key');
    if (!rawKey) {
      next();
      return;
    }

    const keyResult = idempotencyKeySchema.safeParse(rawKey);
    if (!keyResult.success) {
      sendProblem(res, 400, 'Invalid Idempotency-Key header', req.originalUrl);
      return;
    }
    const key = keyResult.data;
    const requestHash = hashRequestBody(req.body);

    const [existing] = await db.select().from(idempotencyKeys).where(eq(idempotencyKeys.key, key));

    if (existing) {
      const isExpired = Date.now() - existing.createdAt.getTime() > IDEMPOTENCY_KEY_TTL_MS;

      if (!isExpired && existing.requestHash !== requestHash) {
        sendProblem(
          res,
          409,
          'Idempotency-Key was already used with a different request payload',
          req.originalUrl,
        );
        return;
      }

      if (!isExpired && existing.responseStatus !== null) {
        res.setHeader('Idempotency-Replayed', 'true');
        res.status(existing.responseStatus).json(existing.responseBody);
        return;
      }

      if (!isExpired) {
        // Same key, same payload, but the original request hasn't finished yet.
        sendProblem(
          res,
          409,
          'A request with this Idempotency-Key is already being processed',
          req.originalUrl,
        );
        return;
      }

      // Expired — reclaim the row for this new attempt.
      await db.delete(idempotencyKeys).where(eq(idempotencyKeys.key, key));
    }

    try {
      await db.insert(idempotencyKeys).values({ key, requestPath: req.originalUrl, requestHash });
    } catch (err) {
      if (isUniqueViolation(err)) {
        sendProblem(
          res,
          409,
          'A request with this Idempotency-Key is already being processed',
          req.originalUrl,
        );
        return;
      }
      next(err);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = ((body?: unknown) => {
      void persistResponse(db, req.log, key, res.statusCode, body);
      return originalJson(body);
    }) as Response['json'];

    next();
  };
}
