"use client";

import { useEffect } from "react";

import { showEventNotification } from "@/components/notification/event";
import { PROPHET_NOTIFICATION_DISPLAY_MS } from "@/config/prophet-ws";
import { mapWsNotificationToEvent } from "@/lib/notification/map-ws-notification-to-event";
import { useNotificationWsStore } from "@/store/notification-ws-store";

export function NotificationQueuePresenter() {
  const headId = useNotificationWsStore((state) => state.queue[0]?.id);
  const queueLength = useNotificationWsStore((state) => state.queue.length);
  const isPresenting = useNotificationWsStore((state) => state.isPresenting);
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

    const options = mapWsNotificationToEvent(item.data);

    if (!options) {
      shiftAfterPresent();
      return;
    }

    setPresenting(true);

    showEventNotification({
      ...options,
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
    queueLength,
    setPresenting,
    shiftAfterPresent,
  ]);

  return null;
}
