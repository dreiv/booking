import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { sendProblem } from '../utils/problemDetails.ts';

const READ_WINDOW_MS = 60 * 1000; // 1m
const READ_MAX_REQUESTS = 100;

const WRITE_WINDOW_MS = 60 * 1000; // 1m
const WRITE_MAX_REQUESTS = 10;

function tooManyRequests(req: Request, res: Response) {
  sendProblem(res, 429, 'Too many requests, please try again later', req.originalUrl);
}

export const readLimiter = rateLimit({
  windowMs: READ_WINDOW_MS,
  limit: READ_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequests,
});

export const writeLimiter = rateLimit({
  windowMs: WRITE_WINDOW_MS,
  limit: WRITE_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequests,
});
