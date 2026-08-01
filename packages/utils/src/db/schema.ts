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
} from 'drizzle-orm/pg-core';

export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'cancelled']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'host', 'guest']);

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  guestName: text('guest_name').notNull(),
  checkIn: date('check_in', { mode: 'string' }).notNull(),
  checkOut: date('check_out', { mode: 'string' }).notNull(),
  status: bookingStatusEnum('status').notNull().default('pending'),
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

export const schema = { bookings, idempotencyKeys, hotel, users };
