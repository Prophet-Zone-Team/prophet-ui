import { getProphetApiBaseUrl } from "@/service/prophet";
import type {
  ProphetAnalyticsTrackBatchRequest,
  ProphetAnalyticsTrackRequest
} from "@/types/prophet-api";

export const ANALYTICS_TRACK_BATCH_SIZE = 5;
export const ANALYTICS_FLUSH_INTERVAL_MS = 10_000;

const ANALYTICS_TRACK_PATH = "/v1/analytics/track";

function resolveAnalyticsTrackUrl(): string {
  return `${getProphetApiBaseUrl()}${ANALYTICS_TRACK_PATH}`;
}

const pendingEvents: ProphetAnalyticsTrackRequest[] = [];
let isProcessing = false;
let flushTimerId: ReturnType<typeof setTimeout> | null = null;

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

function clearAnalyticsFlushTimer(): void {
  if (flushTimerId === null) {
    return;
  }

  clearTimeout(flushTimerId);
  flushTimerId = null;
}

function scheduleAnalyticsFlush(): void {
  if (flushTimerId !== null || isProcessing) {
    return;
  }

  flushTimerId = setTimeout(() => {
    flushTimerId = null;
    void drainAnalyticsTransportQueue();
  }, ANALYTICS_FLUSH_INTERVAL_MS);
}

async function drainAnalyticsTransportQueue(): Promise<void> {
  if (isProcessing) {
    return;
  }

  if (pendingEvents.length === 0) {
    return;
  }

  isProcessing = true;

  while (pendingEvents.length > 0) {
    const batch = pendingEvents.splice(0, ANALYTICS_TRACK_BATCH_SIZE);
    await postAnalyticsBatch(batch);
  }

  isProcessing = false;

  if (pendingEvents.length > 0) {
    scheduleAnalyticsFlush();
  }
}

export function enqueueAnalyticsTransport(payload: ProphetAnalyticsTrackRequest): void {
  if (typeof window === "undefined") {
    return;
  }

  pendingEvents.push(payload);
  scheduleAnalyticsFlush();
}

export async function flushAnalyticsTransportQueueForTests(): Promise<void> {
  clearAnalyticsFlushTimer();
  await drainAnalyticsTransportQueue();
}

export function isAnalyticsFlushScheduledForTests(): boolean {
  return flushTimerId !== null;
}

export function getAnalyticsTransportQueueDepthForTests(): number {
  return pendingEvents.length;
}

export function isAnalyticsTransportProcessingForTests(): boolean {
  return isProcessing;
}

export function resetAnalyticsTransportQueueForTests(): void {
  clearAnalyticsFlushTimer();
  pendingEvents.length = 0;
  isProcessing = false;
}
