import rateLimit from 'express-rate-limit';

const READ_WINDOW_MS = 60 * 1000; // 1m
const READ_MAX_REQUESTS = 100;

const WRITE_WINDOW_MS = 60 * 1000; // 1m
const WRITE_MAX_REQUESTS = 10;

export const readLimiter = rateLimit({
  windowMs: READ_WINDOW_MS,
  limit: READ_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

export const writeLimiter = rateLimit({
  windowMs: WRITE_WINDOW_MS,
  limit: WRITE_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
