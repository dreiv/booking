import type { NextFunction, Request, Response } from 'express';
import { sendProblem } from './problemDetails.ts';

export type UserRole = 'guest' | 'host' | 'admin';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Placeholder authentication using `x-user-id` and `x-user-role` headers.
 * Unauthenticated callers default to an anonymous guest (`id: ''`).
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const id = req.header('x-user-id') ?? '';
  const roleHeader = req.header('x-user-role');
  const role: UserRole = roleHeader === 'admin' || roleHeader === 'host' ? roleHeader : 'guest';
  req.user = { id, role };
  next();
}

/** Parses `req.user.id` (a header string) into the numeric userId used by the DB schema. */
export function getUserId(req: Request): number | undefined {
  const id = req.user?.id;
  if (!id) return undefined;
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Gates route to specified roles. Admin bypasses all role checks as the global management role.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role ?? 'guest';
    if (role === 'admin' || roles.includes(role)) {
      next();
      return;
    }
    sendProblem(res, 403, 'You do not have permission to perform this action', req.originalUrl);
  };
}

/**
 * Grants access if caller owns the resource (`resourceUserId`), possesses a required role, or is an admin.
 */
export function requireSelfOrRole(
  resourceUserId: number,
  req: Request,
  res: Response,
  roles: UserRole[],
): boolean {
  const role = req.user?.role ?? 'guest';
  const requesterId = getUserId(req);
  if (role === 'admin' || roles.includes(role) || requesterId === resourceUserId) {
    return true;
  }
  sendProblem(res, 403, 'You do not have permission to access this booking', req.originalUrl);
  return false;
}
