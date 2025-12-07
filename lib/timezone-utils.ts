/**
 * Timezone Utilities
 * Helper functions for timezone handling (UAE timezone)
 */

/**
 * Get current time in UAE timezone (Asia/Dubai)
 * @returns Date object in UAE timezone
 */
export function getUaeTime(): Date {
  // UAE is UTC+4
  const now = new Date();
  const uaeOffset = 4 * 60; // UTC+4 in minutes
  const localOffset = now.getTimezoneOffset(); // Local timezone offset in minutes
  const uaeTime = new Date(now.getTime() + (localOffset + uaeOffset) * 60 * 1000);
  return uaeTime;
}

/**
 * Format date to UAE timezone string
 * @param date Date to format
 * @returns Formatted date string in UAE timezone
 */
export function formatUaeTime(date: Date): string {
  return date.toLocaleString("en-US", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * Convert date to UAE timezone
 * @param date Date to convert
 * @returns Date in UAE timezone
 */
export function toUaeTime(date: Date): Date {
  const uaeOffset = 4 * 60; // UTC+4 in minutes
  const localOffset = date.getTimezoneOffset();
  return new Date(date.getTime() + (localOffset + uaeOffset) * 60 * 1000);
}

