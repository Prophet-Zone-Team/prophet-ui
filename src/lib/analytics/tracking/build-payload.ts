import { getAnonymousId, getSessionId, getSessionStartedAt } from "./identity";
import { resolveAnalyticsEnvironment } from "./resolve-environment";
import type { ProphetAnalyticsTrackRequest } from "@/types/prophet-api";

function resolveDeviceType(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const width = window.innerWidth;

  if (width < 768) {
    return "mobile";
  }

  if (width < 1024) {
    return "tablet";
  }

  return "desktop";
}

function resolveUtmParams(): Pick<
  ProphetAnalyticsTrackRequest,
  "utmSource" | "utmMedium" | "utmCampaign"
> {
  if (typeof window === "undefined") {
    return {};
  }

  const params = new URLSearchParams(window.location.search);

  return {
    ...(params.get("utm_source")
      ? { utmSource: params.get("utm_source")! }
      : {}),
    ...(params.get("utm_medium")
      ? { utmMedium: params.get("utm_medium")! }
      : {}),
    ...(params.get("utm_campaign")
      ? { utmCampaign: params.get("utm_campaign")! }
      : {})
  };
}

export function buildAnalyticsBasePayload(): Omit<
  ProphetAnalyticsTrackRequest,
  "eventName" | "eventId"
> {
  const sessionStartedAt = getSessionStartedAt();

  return {
    anonymousId: getAnonymousId(),
    sessionId: getSessionId(),
    path: typeof window !== "undefined" ? window.location.pathname : undefined,
    referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
    language: typeof navigator !== "undefined" ? navigator.language : undefined,
    deviceType: resolveDeviceType(),
    environment: resolveAnalyticsEnvironment(),
    source: "client",
    clientTimestamp: new Date().toISOString(),
    ...(sessionStartedAt ? { sessionStartedAt } : {}),
    ...resolveUtmParams()
  };
}
