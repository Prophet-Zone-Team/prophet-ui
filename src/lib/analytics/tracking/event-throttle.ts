import type { ProphetAnalyticsTrackEventName } from "@/types/prophet-api";

export const ANALYTICS_EVENT_THROTTLE_MS = 5_000;

const lastAcceptedAtByKey = new Map<string, number>();

export function resolveAnalyticsThrottleKey(input: {
  eventName: ProphetAnalyticsTrackEventName;
  dedupeKey?: string;
}): string {
  if (input.eventName.endsWith("_changed")) {
    return input.eventName;
  }

  if (input.dedupeKey) {
    return `${input.eventName}:${input.dedupeKey}`;
  }

  return input.eventName;
}

export function shouldSkipThrottledAnalyticsEvent(throttleKey: string): boolean {
  const now = Date.now();
  const lastAcceptedAt = lastAcceptedAtByKey.get(throttleKey);

  if (
    lastAcceptedAt !== undefined &&
    now - lastAcceptedAt < ANALYTICS_EVENT_THROTTLE_MS
  ) {
    return true;
  }

  lastAcceptedAtByKey.set(throttleKey, now);
  return false;
}

export function resetAnalyticsEventThrottleForTests(): void {
  lastAcceptedAtByKey.clear();
}
