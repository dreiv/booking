import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { hotel } from '../db/schema.ts';

extendZodWithOpenApi(z);

export const hotelSchema = createSelectSchema(hotel).strict().openapi('Hotel');

export const createHotelSchema = createInsertSchema(hotel)
  .pick({ name: true, address: true, location: true, description: true })
  .strict()
  .openapi('CreateHotelInput');

export const updateHotelSchema = createHotelSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })
  .openapi('UpdateHotelInput');

export const hotelIdParamSchema = z.coerce.number().int().positive();

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

export const hotelQuerySchema = z
  .object({
    search: z.string().trim().min(1).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT),
  })
  .strict()
  .openapi('HotelQuery');

export const paginatedHotelsSchema = z
  .object({
    data: hotelSchema.array(),
    meta: z.object({
      page: z.number(),
      limit: z.number(),
      totalRecords: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi('PaginatedHotelsResponse');
