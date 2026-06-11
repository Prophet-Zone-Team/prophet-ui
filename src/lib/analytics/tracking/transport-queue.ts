import { getProphetApiBaseUrl } from "@/service/prophet";
import type {
  ProphetAnalyticsTrackBatchRequest,
  ProphetAnalyticsTrackRequest
} from "@/types/prophet-api";

export const ANALYTICS_TRACK_BATCH_SIZE = 5;

const ANALYTICS_TRACK_PATH = "/v1/analytics/track";

function resolveAnalyticsTrackUrl(): string {
  return `${getProphetApiBaseUrl()}${ANALYTICS_TRACK_PATH}`;
}

const pendingEvents: ProphetAnalyticsTrackRequest[] = [];
let isProcessing = false;
let drainScheduled = false;

async function postAnalyticsBatch(batch: ProphetAnalyticsTrackRequest[]): Promise<void> {
  if (batch.length === 0) {
    return;
  }

  try {
    await fetch(resolveAnalyticsTrackUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ list: batch } satisfies ProphetAnalyticsTrackBatchRequest),
      keepalive: true
    });
  } catch {
    // ignore analytics transport failure
  }
}

function scheduleAnalyticsTransportDrain(): void {
  if (isProcessing || drainScheduled) {
    return;
  }

  drainScheduled = true;
  queueMicrotask(() => {
    drainScheduled = false;
    void drainAnalyticsTransportQueue();
  });
}

async function drainAnalyticsTransportQueue(): Promise<void> {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  while (pendingEvents.length > 0) {
    const batch = pendingEvents.splice(0, ANALYTICS_TRACK_BATCH_SIZE);
    await postAnalyticsBatch(batch);
  }

  isProcessing = false;

  if (pendingEvents.length > 0) {
    scheduleAnalyticsTransportDrain();
  }
}

export function enqueueAnalyticsTransport(payload: ProphetAnalyticsTrackRequest): void {
  if (typeof window === "undefined") {
    return;
  }

  pendingEvents.push(payload);
  scheduleAnalyticsTransportDrain();
}

export function getAnalyticsTransportQueueDepthForTests(): number {
  return pendingEvents.length;
}

export function isAnalyticsTransportProcessingForTests(): boolean {
  return isProcessing;
}

export function resetAnalyticsTransportQueueForTests(): void {
  pendingEvents.length = 0;
  isProcessing = false;
  drainScheduled = false;
}
