"use client";

import { toast } from "sonner";

import {
  EventNotificationLevel,
  showEventNotification,
} from "@/components/notification/event";
import { buildProphetNotificationSamples } from "@/data/mock/prophet-notifications";
import { showProphetNotificationToast } from "@/lib/notification/show-prophet-notification-toast";
import { useNotificationWsStore } from "@/store/notification-ws-store";

const testButtonClass =
  "rounded-lg border border-prophet-line bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#fafbfc]";

export default function ToastTestPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-black">Toast Preview</h1>
      <p className="mt-2 text-sm text-prophet-muted">
        Test toast positioning below the top navigation bar.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-medium text-prophet-muted">Sonner</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={testButtonClass}
            onClick={() =>
              toast.success("Order submitted", {
                description: "BUY Argentina · 100 @ 0.58",
              })
            }
          >
            Success toast
          </button>
          <button
            type="button"
            className={testButtonClass}
            onClick={() =>
              toast.error("Unable to submit order", {
                description: "Insufficient balance.",
              })
            }
          >
            Error toast
          </button>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-medium text-prophet-muted">
          Prophet notification (WS / sonner)
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={testButtonClass}
            onClick={() => {
              const [sample] = buildProphetNotificationSamples();
              showProphetNotificationToast(sample);
            }}
          >
            Single notification
          </button>
          <button
            type="button"
            className={testButtonClass}
            onClick={() => {
              for (const sample of buildProphetNotificationSamples()) {
                showProphetNotificationToast(sample);
              }
            }}
          >
            All notification types
          </button>
          <button
            type="button"
            className={testButtonClass}
            onClick={() => {
              const baseTimestamp = Math.floor(Date.now() / 1000);
              const [sample] = buildProphetNotificationSamples(baseTimestamp);
              useNotificationWsStore.getState().enqueue(sample);
            }}
          >
            Enqueue via WS store
          </button>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-medium text-prophet-muted">
          Event notification (match overlay)
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={testButtonClass}
            onClick={() =>
              showEventNotification({
                level: EventNotificationLevel.Goal,
                teams: [
                  {
                    code: "ARG",
                    name: "Argentina",
                    event: "goal",
                    score: "2",
                  },
                  {
                    code: "FRA",
                    name: "France",
                    score: "1",
                  },
                ],
              })
            }
          >
            Goal overlay
          </button>
          <button
            type="button"
            className={testButtonClass}
            onClick={() => {
              const store = useNotificationWsStore.getState();
              store.setOngoingMatchGate("test-match");
              store.enqueueEventNotification(
                {
                  level: EventNotificationLevel.Goal,
                  teams: [
                    {
                      code: "BRA",
                      name: "Brazil",
                      event: "goal",
                      score: "1",
                    },
                    {
                      code: "GER",
                      name: "Germany",
                      score: "0",
                    },
                  ],
                },
                `test-goal:${Date.now()}`,
                "game-statistics",
              );
            }}
          >
            Enqueue via queue presenter
          </button>
        </div>
      </section>
    </div>
  );
}
