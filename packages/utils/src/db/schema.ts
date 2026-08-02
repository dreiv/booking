import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  serial,
  numeric,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const bookingStatusEnum = pgEnum('booking_status', [
  'held',
  'confirmed',
  'cancelled',
  'expired',
]);
export const userRoleEnum = pgEnum('user_role', ['admin', 'host', 'guest']);

export const booking = pgTable('booking', {
  bookingId: uuid('booking_id').primaryKey().defaultRandom(),
  hotelId: integer('hotel_id')
    .notNull()
    .references(() => hotel.hotelId),
  roomTypeId: integer('room_type_id')
    .notNull()
    .references(() => roomType.roomTypeId),
  userId: integer('user_id')
    .notNull()
    .references(() => users.userId),
  guestEmail: text('guest_email').notNull(),
  guestFirstName: text('guest_first_name'),
  guestLastName: text('guest_last_name'),
  startDate: date('start_date', { mode: 'string' }).notNull(),
  endDate: date('end_date', { mode: 'string' }).notNull(),
  status: bookingStatusEnum('status').notNull().default('held'),
  roomCount: integer('room_count').notNull().default(1),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const idempotencyKeys = pgTable('idempotency_keys', {
  key: text('key').primaryKey(),
  requestPath: text('request_path').notNull(),
  requestHash: text('request_hash').notNull(),
  responseStatus: integer('response_status'),
  responseBody: jsonb('response_body'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const hotel = pgTable('hotel', {
  hotelId: serial('hotel_id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  location: text('location').notNull(),
  description: text('description'),
});

export const users = pgTable('users', {
  userId: serial('user_id').primaryKey(),
  email: text('email').notNull().unique(),
  googleId: text('google_id').unique(),
  role: userRoleEnum('role').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
});

export const roomType = pgTable('room_type', {
  roomTypeId: serial('room_type_id').primaryKey(),
  hotelId: integer('hotel_id')
    .notNull()
    .references(() => hotel.hotelId),
  name: text('name').notNull(),
  description: text('description'),
  maxOccupancy: integer('max_occupancy').notNull(),
  amenities: text('amenities'),
  overbookingRate: numeric('overbooking_rate', { precision: 4, scale: 2 }).notNull().default('0'),
});

export const room = pgTable('room', {
  roomId: serial('room_id').primaryKey(),
  hotelId: integer('hotel_id')
    .notNull()
    .references(() => hotel.hotelId),
  roomTypeId: integer('room_type_id')
    .notNull()
    .references(() => roomType.roomTypeId),
  floor: integer('floor').notNull(),
  number: text('number').notNull(),
});

export const roomTypeRate = pgTable(
  'room_type_rate',
  {
    hotelId: integer('hotel_id')
      .notNull()
      .references(() => hotel.hotelId),
    roomTypeId: integer('room_type_id')
      .notNull()
      .references(() => roomType.roomTypeId),
    date: date('date', { mode: 'string' }).notNull(),
    rate: numeric('rate', { precision: 10, scale: 2 }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.hotelId, table.roomTypeId, table.date] }),
  }),
);

export const roomTypeInventory = pgTable(
  'room_type_inventory',
  {
    hotelId: integer('hotel_id')
      .notNull()
      .references(() => hotel.hotelId),
    roomTypeId: integer('room_type_id')
      .notNull()
      .references(() => roomType.roomTypeId),
    date: date('date', { mode: 'string' }).notNull(),
    totalInventory: integer('total_inventory').notNull(),
    totalReserved: integer('total_reserved').notNull().default(0),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.hotelId, table.roomTypeId, table.date] }),
  }),
);

export const schema = {
  booking,
  idempotencyKeys,
  hotel,
  users,
  roomType,
  room,
  roomTypeRate,
  roomTypeInventory,
};
