import type { ComboMarketsDaySnapshot } from "@/types/combo";

const CALENDAR_DATE_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

export function resolveComboMarketsTimezone(
  timezone?: string,
): string {
  const trimmed = timezone?.trim();

  if (trimmed) {
    return trimmed;
  }

  if (typeof Intl !== "undefined") {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  return "UTC";
}

export function getCalendarDateInTimezone(
  timezone: string,
  at: Date = new Date(),
): string {
  const formatter = getCalendarDateFormatter(timezone);
  const parts = formatter.formatToParts(at);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (year && month && day) {
    return `${year}-${month}-${day}`;
  }

  return at.toISOString().slice(0, 10);
}

export function isComboMarketsSnapshotStale(
  snapshot: ComboMarketsDaySnapshot | undefined,
  timezone: string,
  at: Date = new Date(),
): boolean {
  if (!snapshot?.cachedOnDate) {
    return true;
  }

  return snapshot.cachedOnDate !== getCalendarDateInTimezone(timezone, at);
}

export function hasFreshComboMarketsSnapshot(
  snapshot: ComboMarketsDaySnapshot | undefined,
  timezone: string,
  at: Date = new Date(),
): boolean {
  if (!snapshot || snapshot.groups.length === 0) {
    return false;
  }

  return !isComboMarketsSnapshotStale(snapshot, timezone, at);
}

/** Milliseconds until the next calendar-day boundary in the given timezone. */
export function getMsUntilNextCalendarDay(
  timezone: string,
  at: Date = new Date(),
): number {
  const currentDate = getCalendarDateInTimezone(timezone, at);
  const probe = new Date(at.getTime() + 60_000);

  while (getCalendarDateInTimezone(timezone, probe) === currentDate) {
    probe.setTime(probe.getTime() + 60_000);
  }

  return Math.max(probe.getTime() - at.getTime(), 1_000);
}

function getCalendarDateFormatter(timezone: string): Intl.DateTimeFormat {
  const cached = CALENDAR_DATE_FORMATTER_CACHE.get(timezone);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  CALENDAR_DATE_FORMATTER_CACHE.set(timezone, formatter);

  return formatter;
}
