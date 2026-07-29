import type { NextFunction, Request, Response } from 'express';
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Database } from '../db/types.ts';
import { idempotencyKeys } from 'utils/db-schema';
import { idempotencyKeySchema } from 'utils/idempotency-schema';

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

async function persistResponse(db: Database, key: string, status: number, body: unknown) {
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
    console.error('Failed to persist idempotency record', err);
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
      res.status(400).json({ error: 'Invalid Idempotency-Key header' });
      return;
    }
    const key = keyResult.data;
    const requestHash = hashRequestBody(req.body);

    const [existing] = await db.select().from(idempotencyKeys).where(eq(idempotencyKeys.key, key));

    if (existing) {
      const isExpired = Date.now() - existing.createdAt.getTime() > IDEMPOTENCY_KEY_TTL_MS;

      if (!isExpired && existing.requestHash !== requestHash) {
        res.status(409).json({
          error: 'Idempotency-Key was already used with a different request payload',
        });
        return;
      }

      if (!isExpired && existing.responseStatus !== null) {
        res.setHeader('Idempotency-Replayed', 'true');
        res.status(existing.responseStatus).json(existing.responseBody);
        return;
      }

      if (!isExpired) {
        // Same key, same payload, but the original request hasn't finished yet.
        res.status(409).json({
          error: 'A request with this Idempotency-Key is already being processed',
        });
        return;
      }

      // Expired — reclaim the row for this new attempt.
      await db.delete(idempotencyKeys).where(eq(idempotencyKeys.key, key));
    }

    try {
      await db.insert(idempotencyKeys).values({ key, requestPath: req.originalUrl, requestHash });
    } catch (err) {
      if (isUniqueViolation(err)) {
        res.status(409).json({
          error: 'A request with this Idempotency-Key is already being processed',
        });
        return;
      }
      next(err);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = ((body?: unknown) => {
      void persistResponse(db, key, res.statusCode, body);
      return originalJson(body);
    }) as Response['json'];

    next();
  };
}
