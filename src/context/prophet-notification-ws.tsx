"use client";

import { useEffect, type ReactNode } from "react";

import { NotificationQueuePresenter } from "@/components/notification/notification-queue-presenter";
import { enqueueProphetNotificationSamples } from "@/lib/notification/enqueue-prophet-notification-samples";
import { isMockProphetNotificationsEnabled } from "@/lib/notification/mock-prophet-notifications-config";
import { getProphetNotificationWsClient } from "@/lib/notification/prophet-notification-ws-client";
import {
  getProphetApiToken,
  PROPHET_API_TOKEN_CHANGED_EVENT,
} from "@/service/prophet";
import { useNotificationWsStore } from "@/store/notification-ws-store";

const AUTH_STORAGE_KEY = "prophet_api_token";

export interface ProphetNotificationWsProviderProps {
  children: ReactNode;
}

export function ProphetNotificationWsProvider({
  children,
}: ProphetNotificationWsProviderProps) {
  const enqueue = useNotificationWsStore((state) => state.enqueue);
  const setConnectionStatus = useNotificationWsStore(
    (state) => state.setConnectionStatus,
  );

  useEffect(() => {
    const client = getProphetNotificationWsClient();

    const syncConnection = () => {
      const token = getProphetApiToken();

      if (!token) {
        client.disconnect();
        setConnectionStatus("idle");
        return;
      }

      client.connect(token);
    };

    syncConnection();

    const unsubscribeMessages = client.subscribe((data) => {
      enqueue(data);
    });

    const unsubscribeStatus = client.subscribeStatus((status) => {
      if (status === "connecting") {
        setConnectionStatus("connecting");
        return;
      }

      if (status === "open") {
        setConnectionStatus("open");
        return;
      }

      if (status === "error") {
        setConnectionStatus("error");
        return;
      }

      const token = getProphetApiToken();
      setConnectionStatus(token ? "idle" : "idle");
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_STORAGE_KEY) {
        return;
      }

      syncConnection();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(PROPHET_API_TOKEN_CHANGED_EVENT, syncConnection);

    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        PROPHET_API_TOKEN_CHANGED_EVENT,
        syncConnection,
      );
      client.disconnect();
      setConnectionStatus("idle");
    };
  }, [enqueue, setConnectionStatus]);

  useEffect(() => {
    if (!isMockProphetNotificationsEnabled()) {
      return;
    }

    enqueueProphetNotificationSamples();
  }, []);

  return (
    <>
      {children}
      <NotificationQueuePresenter />
    </>
  );
}
