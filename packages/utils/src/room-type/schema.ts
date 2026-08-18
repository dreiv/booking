import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { roomType } from '../db/schema.ts';

extendZodWithOpenApi(z);

export const roomTypeSchema = createSelectSchema(roomType).strict().openapi('RoomType');

// hotelId is taken from the URL (/hotels/{hotelId}/room-types), not the body.
export const createRoomTypeSchema = createInsertSchema(roomType)
  .pick({
    name: true,
    description: true,
    maxOccupancy: true,
    amenities: true,
    overbookingRate: true,
  })
  .partial({ description: true, amenities: true, overbookingRate: true })
  .strict()
  .openapi('CreateRoomTypeInput');

export const updateRoomTypeSchema = createRoomTypeSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })
  .openapi('UpdateRoomTypeInput');

export const roomTypeIdParamSchema = z.coerce
  .number()
  .int()
  .positive()
  .openapi({ param: { name: 'roomTypeId', in: 'path' }, example: 1 });
