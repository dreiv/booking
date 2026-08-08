import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { hotelSchema } from '../hotel/schema.ts';
import { roomTypeSchema } from '../room-type/schema.ts';
import { isValidBookingDateRange } from '../booking/dates.ts';

extendZodWithOpenApi(z);

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

export const searchQuerySchema = z
  .object({
    location: z.string().trim().min(1),
    checkIn: z.string().date(),
    checkOut: z.string().date(),
    guests: z.coerce.number().int().min(1).default(1),
    priceMin: z.coerce.number().nonnegative().optional(),
    priceMax: z.coerce.number().positive().optional(),
    // Comma-separated in the querystring, e.g. amenities=wifi,pool
    amenities: z
      .string()
      .trim()
      .min(1)
      .optional()
      .transform((value) =>
        value
          ? value
              .split(',')
              .map((amenity) => amenity.trim())
              .filter(Boolean)
          : undefined,
      ),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT),
  })
  .strict()
  .refine((data) => isValidBookingDateRange(data.checkIn, data.checkOut), {
    message: 'checkOut must be after checkIn',
    path: ['checkOut'],
  })
  .refine(
    (data) =>
      data.priceMin === undefined || data.priceMax === undefined || data.priceMin <= data.priceMax,
    {
      message: 'priceMin must be less than or equal to priceMax',
      path: ['priceMin'],
    },
  )
  .openapi('SearchQuery');

export const searchResultSchema = z
  .object({
    hotel: hotelSchema,
    roomType: roomTypeSchema,
    nightlyRates: z.array(z.object({ date: z.string(), rate: z.string() })),
    totalPrice: z.string(),
    roomsAvailable: z.number(),
  })
  .openapi('SearchResult');

export const paginatedSearchResultsSchema = z
  .object({
    data: searchResultSchema.array(),
    meta: z.object({
      page: z.number(),
      limit: z.number(),
      totalRecords: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi('PaginatedSearchResultsResponse');
