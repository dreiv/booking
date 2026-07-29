import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const problemDetailsSchema = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number(),
    detail: z.string(),
    instance: z.string(),
  })
  .strict()
  .openapi('ProblemDetails');
