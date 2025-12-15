/**
 * Timezone Utilities for Cron Jobs
 * Helper functions for timezone handling in cron jobs (Dubai timezone)
 */

const DUBAI_TIMEZONE = "Asia/Dubai";

/**
 * Get current date in Dubai timezone (date only, no time)
 * Returns a Date object representing today at midnight in Dubai timezone
 */
export function getDubaiToday(): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: DUBAI_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === "year")?.value || "0", 10);
  const month = parseInt(parts.find(p => p.type === "month")?.value || "0", 10);
  const day = parseInt(parts.find(p => p.type === "day")?.value || "0", 10);
  
  // Create date at midnight Dubai time (stored as UTC)
  // Dubai midnight (00:00:00) = UTC 20:00:00 previous day
  return new Date(Date.UTC(year, month - 1, day - 1, 20, 0, 0, 0));
}

/**
 * Get start of day in Dubai timezone
 * @param date Optional date, defaults to today
 */
export function getDubaiStartOfDay(date?: Date): Date {
  const targetDate = date || new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: DUBAI_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  const parts = formatter.formatToParts(targetDate);
  const year = parseInt(parts.find(p => p.type === "year")?.value || "0", 10);
  const month = parseInt(parts.find(p => p.type === "month")?.value || "0", 10);
  const day = parseInt(parts.find(p => p.type === "day")?.value || "0", 10);
  
  return new Date(Date.UTC(year, month - 1, day - 1, 20, 0, 0, 0));
}

/**
 * Get end of day in Dubai timezone
 * @param date Optional date, defaults to today
 */
export function getDubaiEndOfDay(date?: Date): Date {
  const startOfDay = getDubaiStartOfDay(date);
  // Add 24 hours minus 1 millisecond
  return new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * Get date N days ago in Dubai timezone
 * @param days Number of days ago
 */
export function getDubaiDaysAgo(days: number): Date {
  const today = getDubaiToday();
  return new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
}

/**
 * Get date N days from now in Dubai timezone
 * @param days Number of days from now
 */
export function getDubaiDaysFromNow(days: number): Date {
  const today = getDubaiToday();
  return new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Check if a date is today in Dubai timezone
 * @param date Date to check
 */
export function isDubaiToday(date: Date): boolean {
  const today = getDubaiToday();
  const targetDay = getDubaiStartOfDay(date);
  return today.getTime() === targetDay.getTime();
}

/**
 * Format date to Dubai timezone string for logging
 * @param date Date to format
 */
export function formatDubaiDate(date: Date): string {
  return date.toLocaleString("en-US", {
    timeZone: DUBAI_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

