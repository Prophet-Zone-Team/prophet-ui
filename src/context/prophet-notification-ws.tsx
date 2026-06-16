"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { NotificationQueuePresenter } from "@/components/notification/notification-queue-presenter";
import { useAuth } from "@/context/auth";
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
  const { session, hydrated } = useAuth();
  const mockSamplesEnqueuedRef = useRef(false);

  const walletAddress = session?.walletAddress ?? null;
  const apiToken = hydrated && walletAddress ? getProphetApiToken() : null;

  useEffect(() => {
    const client = getProphetNotificationWsClient();

    const unsubscribeMessages = client.subscribe((data) => {
      useNotificationWsStore.getState().enqueue(data);
    });

    const unsubscribeStatus = client.subscribeStatus((status) => {
      const setConnectionStatus =
        useNotificationWsStore.getState().setConnectionStatus;

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

      setConnectionStatus("idle");
    });

    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
    };
  }, []);

  useEffect(() => {
    const client = getProphetNotificationWsClient();
    const setConnectionStatus =
      useNotificationWsStore.getState().setConnectionStatus;

    const syncConnection = () => {
      const token = getProphetApiToken();

      if (!hydrated || !walletAddress || !token) {
        client.disconnect();
        setConnectionStatus("idle");
        return;
      }

      client.connect(token);
    };

    if (!apiToken) {
      client.disconnect();
      setConnectionStatus("idle");
    } else {
      client.connect(apiToken);
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_STORAGE_KEY) {
        return;
      }

      syncConnection();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(PROPHET_API_TOKEN_CHANGED_EVENT, syncConnection);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        PROPHET_API_TOKEN_CHANGED_EVENT,
        syncConnection
      );
      client.disconnect();
      setConnectionStatus("idle");
    };
  }, [apiToken, hydrated, walletAddress]);

  useEffect(() => {
    if (!isMockProphetNotificationsEnabled() || !session) {
      return;
    }

    if (mockSamplesEnqueuedRef.current) {
      return;
    }

    mockSamplesEnqueuedRef.current = true;
    enqueueProphetNotificationSamples();
  }, [session]);

  return (
    <>
      {children}
      <NotificationQueuePresenter />
    </>
  );
}
