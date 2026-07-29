import type { Response } from 'express';
import type { z, ZodError } from 'zod';
import { problemDetailsSchema } from 'utils/problem-details-schema';

type ProblemDetails = z.infer<typeof problemDetailsSchema>;

const STATUS_TITLES: Record<number, string> = {
  400: 'Bad Request',
  404: 'Not Found',
  409: 'Conflict',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

export function sendProblem(res: Response, status: number, detail: string, instance: string) {
  const body: ProblemDetails = {
    type: 'about:blank',
    title: STATUS_TITLES[status] ?? 'Error',
    status,
    detail,
    instance,
  };
  res.status(status).contentType('application/problem+json').json(body);
}

export function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
}
