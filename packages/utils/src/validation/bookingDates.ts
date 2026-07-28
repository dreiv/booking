export function isValidBookingDateRange(checkIn: string, checkOut: string): boolean {
  return new Date(checkOut) > new Date(checkIn);
}
