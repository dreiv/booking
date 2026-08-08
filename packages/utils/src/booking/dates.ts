export function isValidBookingDateRange(checkIn: string, checkOut: string): boolean {
  return new Date(checkOut) > new Date(checkIn);
}

/** Returns ISO date strings (YYYY-MM-DD) for each night (checkIn inclusive, checkOut exclusive). */
export function getNightsInRange(checkIn: string, checkOut: string): string[] {
  const nights: string[] = [];
  const cursor = new Date(`${checkIn}T00:00:00.000Z`);
  const end = new Date(`${checkOut}T00:00:00.000Z`);

  while (cursor < end) {
    nights.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return nights;
}

const CANCELLATION_CUTOFF_HOURS = 24;

/** Returns true if cancellation is requested at least `CANCELLATION_CUTOFF_HOURS` before check-in. */
export function isCancellationAllowed(checkIn: string, now: Date = new Date()): boolean {
  const checkInDate = new Date(`${checkIn}T00:00:00.000Z`);
  const cutoffMs = CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000;
  return checkInDate.getTime() - now.getTime() >= cutoffMs;
}
