"use client";

import { useEffect } from "react";

import { showEventNotification, dismissEventNotification } from "@/components/notification/event";
import { PROPHET_NOTIFICATION_DISPLAY_MS } from "@/config/prophet-ws";
import { useNotificationWsStore } from "@/store/notification-ws-store";

function shouldPresentQueueItem(
  item: { source?: "game-statistics" | "ws" },
  ongoingMatchSlug: string | null,
): boolean {
  if (item.source !== "game-statistics") {
    return true;
  }

  return ongoingMatchSlug !== null;
}

/** Presents game-statistics score overlays from the queue. WS market toasts render immediately via sonner. */
export function NotificationQueuePresenter() {
  const headId = useNotificationWsStore((state) => state.queue[0]?.id);
  const queueLength = useNotificationWsStore((state) => state.queue.length);
  const isPresenting = useNotificationWsStore((state) => state.isPresenting);
  const ongoingMatchSlug = useNotificationWsStore(
    (state) => state.ongoingMatchSlug,
  );
  const setPresenting = useNotificationWsStore((state) => state.setPresenting);
  const shiftAfterPresent = useNotificationWsStore(
    (state) => state.shiftAfterPresent,
  );

  useEffect(() => {
    if (isPresenting || queueLength === 0 || !headId) {
      return;
    }

    const item = useNotificationWsStore.getState().queue[0];

    if (!item || item.id !== headId) {
      return;
    }

    if (!shouldPresentQueueItem(item, ongoingMatchSlug)) {
      shiftAfterPresent();
      dismissEventNotification();
      return;
    }

    setPresenting(true);

    showEventNotification({
      ...item.options,
      duration: PROPHET_NOTIFICATION_DISPLAY_MS,
      onDismiss: () => {
        const state = useNotificationWsStore.getState();

        if (state.queue[0]?.id !== headId) {
          state.setPresenting(false);
          return;
        }

        state.shiftAfterPresent();
        state.setPresenting(false);
      },
    });
  }, [
    headId,
    isPresenting,
    ongoingMatchSlug,
    queueLength,
    setPresenting,
    shiftAfterPresent,
  ]);

  return null;
}
