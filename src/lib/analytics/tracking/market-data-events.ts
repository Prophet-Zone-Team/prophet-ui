import { trackAnalyticsEvent } from "./track";

export function trackMarketDataLoaded(input: {
  latencyMs: number;
  lastUpdated?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "market_data_loaded",
    latencyMs: input.latencyMs,
    dataLoadedAt: new Date().toISOString(),
    ...(input.lastUpdated ? { lastUpdated: input.lastUpdated } : {})
  });
}

export function trackDataProviderFailed(input: {
  latencyMs?: number;
  failureReason?: string;
  errorCode?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "data_provider_failed",
    ...(input.latencyMs !== undefined ? { latencyMs: input.latencyMs } : {}),
    ...(input.failureReason ? { failureReason: input.failureReason } : {}),
    ...(input.errorCode ? { errorCode: input.errorCode } : {})
  });
}

export function trackFallbackDataUsed(input: {
  fallbackType: string;
  path?: string;
}): void {
  trackAnalyticsEvent({
    eventName: "fallback_data_used",
    path: input.path,
    properties: {
      fallbackType: input.fallbackType
    }
  });
}

export function classifyProviderFailure(error: unknown): {
  failureReason: string;
  errorCode: string;
} {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes("timeout")) {
    return {
      failureReason: "timeout",
      errorCode: "PROVIDER_TIMEOUT"
    };
  }

  if (message.includes("network") || message.includes("fetch")) {
    return {
      failureReason: "network",
      errorCode: "PROVIDER_NETWORK"
    };
  }

  return {
    failureReason: "unknown",
    errorCode: "PROVIDER_ERROR"
  };
}
