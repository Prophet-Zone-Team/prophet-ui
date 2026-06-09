import { buildProphetNotificationSamples } from "@/data/mock/prophet-notifications";
import { useNotificationWsStore } from "@/store/notification-ws-store";

/**
 * Enqueues one mock notification per WS toast notice_type for local preview.
 */
export function enqueueProphetNotificationSamples(): void {
  const samples = buildProphetNotificationSamples();
  const enqueue = useNotificationWsStore.getState().enqueue;

  for (const sample of samples) {
    enqueue(sample);
  }
}
