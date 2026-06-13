import type {
  ProphetAnalyticsTrackEventName,
  ProphetAnalyticsTrackRequest
} from "@/types/prophet-api";

import { buildAnalyticsBasePayload } from "./build-payload";
import {
  resolveAnalyticsThrottleKey,
  shouldSkipThrottledAnalyticsEvent
} from "./event-throttle";
import { enqueueAnalyticsTransport } from "./transport-queue";

export type AnalyticsTrackInput = Omit<
  ProphetAnalyticsTrackRequest,
  "eventName" | "eventId"
> & {
  eventName: ProphetAnalyticsTrackEventName;
  eventId?: string;
};

function createEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function trackAnalyticsEvent(input: AnalyticsTrackInput): void {
  try {
    const payload: ProphetAnalyticsTrackRequest = {
      ...buildAnalyticsBasePayload(),
      ...input,
      eventId: input.eventId ?? createEventId()
    };

    const throttleKey = resolveAnalyticsThrottleKey({
      eventName: payload.eventName,
      dedupeKey: payload.dedupeKey
    });

    if (shouldSkipThrottledAnalyticsEvent(throttleKey)) {
      return;
    }

    enqueueAnalyticsTransport(payload);
  } catch {
    // ignore analytics failure
  }
}
