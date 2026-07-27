import { pgTable, uuid, text, date, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const roomTypeEnum = pgEnum('room_type', ['single', 'double', 'suite']);
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'cancelled']);

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  guestName: text('guest_name').notNull(),
  roomType: roomTypeEnum('room_type').notNull(),
  checkIn: date('check_in', { mode: 'string' }).notNull(),
  checkOut: date('check_out', { mode: 'string' }).notNull(),
  status: bookingStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const schema = { bookings };
