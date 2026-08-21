// Local date (Europe/Berlin) as YYYY-MM-DD.
// new Date().toISOString() returns UTC, which shifts entries made
// between midnight and 2:00 to the previous day. This helper uses
// the device's local timezone instead.
export function localDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
