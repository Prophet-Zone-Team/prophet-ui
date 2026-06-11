import { getProphetApiBaseUrl } from "@/service/prophet";
import type {
  ProphetAnalyticsTrackEventName,
  ProphetAnalyticsTrackRequest
} from "@/types/prophet-api";

import { buildAnalyticsBasePayload } from "./build-payload";
import { resolveAnalyticsEnvironment } from "./resolve-environment";

const ANALYTICS_TRACK_PATH = "/v1/analytics/track";

function resolveAnalyticsTrackUrl(): string {
  return `${getProphetApiBaseUrl()}${ANALYTICS_TRACK_PATH}`;
}

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

function postAnalyticsPayload(body: string): void {
  void fetch(resolveAnalyticsTrackUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true
  }).catch(() => {
    // ignore analytics transport failure
  });
}

function sendAnalyticsPayload(body: string): void {
  if (typeof window === "undefined") {
    return;
  }

  // Local dev: use fetch so requests appear in DevTools as normal POST calls.
  if (resolveAnalyticsEnvironment() === "local") {
    postAnalyticsPayload(body);
    return;
  }

  try {
    if (typeof navigator.sendBeacon === "function") {
      const accepted = navigator.sendBeacon(
        resolveAnalyticsTrackUrl(),
        new Blob([body], { type: "application/json" })
      );

      if (accepted) {
        return;
      }
    }
  } catch {
    // ignore analytics transport failure
  }

  postAnalyticsPayload(body);
}

export function trackAnalyticsEvent(input: AnalyticsTrackInput): void {
  try {
    const payload: ProphetAnalyticsTrackRequest = {
      ...buildAnalyticsBasePayload(),
      ...input,
      eventId: input.eventId ?? createEventId()
    };

    sendAnalyticsPayload(JSON.stringify(payload));
  } catch {
    // ignore analytics failure
  }
}
