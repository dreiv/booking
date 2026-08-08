import { z } from 'zod';
import {
  roomTypeSchema,
  createRoomTypeSchema,
  updateRoomTypeSchema,
  roomTypeIdParamSchema,
} from 'utils/room-type-schema';
import { hotelIdParamSchema } from 'utils/hotel-schema';
import { problemDetailsSchema } from 'utils/problem-details-schema';
import { registry } from '../shared/openapi.ts';

function problemResponse(description: string) {
  return {
    description,
    content: { 'application/problem+json': { schema: problemDetailsSchema } },
  };
}

const pathParams = z.object({ hotelId: hotelIdParamSchema, roomTypeId: roomTypeIdParamSchema });

registry.registerPath({
  method: 'get',
  path: '/api/v1/hotels/{hotelId}/room-types/{roomTypeId}',
  summary: 'Get a room type by id',
  request: { params: pathParams },
  responses: {
    200: {
      description: 'The room type',
      content: { 'application/json': { schema: roomTypeSchema } },
    },
    400: problemResponse('Invalid identifier format'),
    404: problemResponse('Not found'),
    429: problemResponse('Too many requests'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/hotels/{hotelId}/room-types',
  summary: 'Add a room type to a hotel (host or admin)',
  request: {
    params: z.object({ hotelId: hotelIdParamSchema }),
    body: { content: { 'application/json': { schema: createRoomTypeSchema } } },
  },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: roomTypeSchema } } },
    400: problemResponse('Invalid payload'),
    403: problemResponse('Caller is not a host or admin'),
    429: problemResponse('Too many requests'),
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/hotels/{hotelId}/room-types/{roomTypeId}',
  summary: "Update a room type's details or pricing rules (host or admin)",
  request: {
    params: pathParams,
    body: { content: { 'application/json': { schema: updateRoomTypeSchema } } },
  },
  responses: {
    200: { description: 'Updated', content: { 'application/json': { schema: roomTypeSchema } } },
    400: problemResponse('Invalid payload'),
    403: problemResponse('Caller is not a host or admin'),
    404: problemResponse('Not found'),
    429: problemResponse('Too many requests'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/hotels/{hotelId}/room-types/{roomTypeId}',
  summary: 'Remove a room type (host or admin)',
  request: { params: pathParams },
  responses: {
    204: { description: 'Deleted' },
    400: problemResponse('Invalid identifier format'),
    403: problemResponse('Caller is not a host or admin'),
    404: problemResponse('Not found'),
    429: problemResponse('Too many requests'),
  },
});
