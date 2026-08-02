import { db } from '../src/shared/db/client.ts';
import { booking, hotel, roomType, users } from 'utils/db-schema';

await db.delete(booking);
await db.delete(roomType);
await db.delete(users);
await db.delete(hotel);

const [seedHotel] = await db
  .insert(hotel)
  .values({
    name: 'Grand Central Hotel',
    address: '123 Main St',
    location: 'New York, NY',
    description: 'A seed hotel for local development.',
  })
  .returning();
if (!seedHotel) throw new Error('Failed to seed hotel');

const [seedRoomType] = await db
  .insert(roomType)
  .values({
    hotelId: seedHotel.hotelId,
    name: 'Standard Double',
    description: 'A comfortable double room.',
    maxOccupancy: 2,
    amenities: 'wifi, tv, air conditioning',
  })
  .returning();
if (!seedRoomType) throw new Error('Failed to seed room type');

const seedUsers = await db
  .insert(users)
  .values([
    { email: 'ada@example.com', role: 'guest', firstName: 'Ada', lastName: 'Lovelace' },
    { email: 'alan@example.com', role: 'guest', firstName: 'Alan', lastName: 'Turing' },
    { email: 'grace@example.com', role: 'guest', firstName: 'Grace', lastName: 'Hopper' },
  ])
  .returning();

const dateRanges = [
  { startDate: '2026-08-01', endDate: '2026-08-05' },
  { startDate: '2026-08-10', endDate: '2026-08-12' },
  { startDate: '2026-09-01', endDate: '2026-09-03' },
];

const seedData = seedUsers.map((user, i) => {
  const range = dateRanges[i];
  if (!range) throw new Error(`No date range configured for seed user index ${i}`);
  return {
    hotelId: seedHotel.hotelId,
    roomTypeId: seedRoomType.roomTypeId,
    userId: user.userId,
    guestEmail: user.email,
    guestFirstName: user.firstName,
    guestLastName: user.lastName,
    startDate: range.startDate,
    endDate: range.endDate,
    status: 'confirmed' as const,
  };
});

await db.insert(booking).values(seedData);

console.log(`Seeded ${seedData.length} bookings.`);
process.exit(0);
