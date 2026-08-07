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
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const bookingStatusEnum = pgEnum('booking_status', [
  'held',
  'confirmed',
  'cancelled',
  'expired',
]);
export const userRoleEnum = pgEnum('user_role', ['admin', 'host', 'guest']);
export const transactionTypeEnum = pgEnum('transaction_type', ['payment', 'refund']);

export const booking = pgTable(
  'booking',
  {
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
    checkIn: date('check_in', { mode: 'string' }).notNull(),
    checkOut: date('check_out', { mode: 'string' }).notNull(),
    status: bookingStatusEnum('status').notNull().default('held'),
    roomCount: integer('room_count').notNull().default(1),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('booking_user_idx').on(table.userId),
    roomTypeDatesIdx: index('booking_room_type_dates_idx').on(
      table.roomTypeId,
      table.checkIn,
      table.checkOut,
    ),
  }),
);

export const transaction = pgTable(
  'transaction',
  {
    transactionId: serial('transaction_id').primaryKey(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => booking.bookingId),
    transactionType: transactionTypeEnum('transaction_type').notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(), // negative for refunds
    transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull().defaultNow(),
    notes: text('notes'),
  },
  (table) => ({
    bookingIdx: index('transaction_booking_idx').on(table.bookingId),
  }),
);

export const idempotencyKeys = pgTable('idempotency_keys', {
  key: text('key').primaryKey(),
  requestPath: text('request_path').notNull(),
  requestHash: text('request_hash').notNull(),
  responseStatus: integer('response_status'),
  responseBody: jsonb('response_body'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const hotel = pgTable(
  'hotel',
  {
    hotelId: serial('hotel_id').primaryKey(),
    name: text('name').notNull(),
    address: text('address').notNull(),
    location: text('location').notNull(),
    description: text('description'),
  },
  (table) => ({
    // requires: CREATE EXTENSION IF NOT EXISTS pg_trgm;
    locationTrgmIdx: index('hotel_location_trgm_idx').using(
      'gin',
      sql`${table.location} gin_trgm_ops`,
    ),
  }),
);

export const users = pgTable('users', {
  userId: serial('user_id').primaryKey(),
  email: text('email').notNull().unique(),
  googleId: text('google_id').unique(),
  role: userRoleEnum('role').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
});

export const roomType = pgTable(
  'room_type',
  {
    roomTypeId: serial('room_type_id').primaryKey(),
    hotelId: integer('hotel_id')
      .notNull()
      .references(() => hotel.hotelId),
    name: text('name').notNull(),
    description: text('description'),
    maxOccupancy: integer('max_occupancy').notNull(),
    amenities: text('amenities').array(),
    overbookingRate: numeric('overbooking_rate', { precision: 4, scale: 2 }).notNull().default('0'),
  },
  (table) => ({
    hotelIdx: index('room_type_hotel_idx').on(table.hotelId),
    hotelOccupancyIdx: index('room_type_hotel_occupancy_idx').on(table.hotelId, table.maxOccupancy),
    amenitiesIdx: index('room_type_amenities_idx').using('gin', table.amenities),
  }),
);

export const room = pgTable(
  'room',
  {
    roomId: serial('room_id').primaryKey(),
    hotelId: integer('hotel_id')
      .notNull()
      .references(() => hotel.hotelId),
    roomTypeId: integer('room_type_id')
      .notNull()
      .references(() => roomType.roomTypeId),
    floor: integer('floor').notNull(),
    number: text('number').notNull(),
  },
  (table) => ({
    roomTypeIdx: index('room_room_type_idx').on(table.roomTypeId),
  }),
);

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
    dateRateIdx: index('room_type_rate_date_rate_idx').on(table.date, table.rate),
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
    roomTypeDateIdx: index('room_type_inventory_room_type_date_idx').on(
      table.roomTypeId,
      table.date,
    ),
  }),
);

export const schema = {
  booking,
  transaction,
  idempotencyKeys,
  hotel,
  users,
  roomType,
  room,
  roomTypeRate,
  roomTypeInventory,
};
