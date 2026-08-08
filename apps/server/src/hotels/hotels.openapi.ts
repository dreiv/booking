import { z } from 'zod';
import {
  hotelSchema,
  createHotelSchema,
  updateHotelSchema,
  hotelIdParamSchema,
  hotelQuerySchema,
  paginatedHotelsSchema,
} from 'utils/hotel-schema';
import { problemDetailsSchema } from 'utils/problem-details-schema';
import { registry } from '../shared/openapi.ts';

function problemResponse(description: string) {
  return {
    description,
    content: { 'application/problem+json': { schema: problemDetailsSchema } },
  };
}

registry.registerPath({
  method: 'get',
  path: '/api/v1/hotels',
  summary: 'List hotels, with optional location search and pagination',
  request: { query: hotelQuerySchema },
  responses: {
    200: {
      description: 'A page of hotels',
      content: { 'application/json': { schema: paginatedHotelsSchema } },
    },
    400: problemResponse('Invalid or excessive query parameters'),
    429: problemResponse('Too many requests'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/hotels/{id}',
  summary: 'Get a hotel by id',
  request: { params: z.object({ id: hotelIdParamSchema }) },
  responses: {
    200: { description: 'The hotel', content: { 'application/json': { schema: hotelSchema } } },
    400: problemResponse('Invalid identifier format'),
    404: problemResponse('Not found'),
    429: problemResponse('Too many requests'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/hotels',
  summary: 'Add a new hotel (host or admin)',
  request: { body: { content: { 'application/json': { schema: createHotelSchema } } } },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: hotelSchema } } },
    400: problemResponse('Invalid payload'),
    403: problemResponse('Caller is not a host or admin'),
    429: problemResponse('Too many requests'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/hotels/{id}',
  summary: "Update a hotel's details (host or admin)",
  request: {
    params: z.object({ id: hotelIdParamSchema }),
    body: { content: { 'application/json': { schema: updateHotelSchema } } },
  },
  responses: {
    200: { description: 'Updated', content: { 'application/json': { schema: hotelSchema } } },
    400: problemResponse('Invalid payload'),
    403: problemResponse('Caller is not a host or admin'),
    404: problemResponse('Not found'),
    429: problemResponse('Too many requests'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/hotels/{id}',
  summary: 'Remove a hotel (host or admin)',
  request: { params: z.object({ id: hotelIdParamSchema }) },
  responses: {
    204: { description: 'Deleted' },
    400: problemResponse('Invalid identifier format'),
    403: problemResponse('Caller is not a host or admin'),
    404: problemResponse('Not found'),
    429: problemResponse('Too many requests'),
  },
});
