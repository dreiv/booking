import { db } from '../src/shared/db/client.ts';
import { bookings } from 'utils/db-schema';

const seedData = [
  {
    guestName: 'Ada Lovelace',
    checkIn: '2026-08-01',
    checkOut: '2026-08-05',
  },
  {
    guestName: 'Alan Turing',
    checkIn: '2026-08-10',
    checkOut: '2026-08-12',
  },
  {
    guestName: 'Grace Hopper',
    checkIn: '2026-09-01',
    checkOut: '2026-09-03',
  },
];

await db.delete(bookings);
await db.insert(bookings).values(seedData);

console.log(`Seeded ${seedData.length} bookings.`);
process.exit(0);
