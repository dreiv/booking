import type { NextFunction, Request, Response } from 'express';
import { sendProblem } from '../utils/problemDetails.ts';

const MAX_QUERY_PARAMS = 10;

export function queryParamGuard(req: Request, res: Response, next: NextFunction) {
  if (Object.keys(req.query).length > MAX_QUERY_PARAMS) {
    sendProblem(res, 400, `Too many query parameters (max ${MAX_QUERY_PARAMS})`, req.originalUrl);
    return;
  }
  next();
}
