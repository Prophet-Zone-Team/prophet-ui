"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ShowEventNotificationOptions } from "@/components/notification/event";
import {
  buildNotificationDedupeKey,
  mapWsNotificationToEvent,
} from "@/lib/notification/map-ws-notification-to-event";
import type { ProphetNotificationData } from "@/types/prophet-notification-ws";
import type { ProphetWsConnectionStatus } from "@/types/prophet-notification-ws";

export interface QueuedEventNotification {
  id: string;
  receivedAt: number;
  dedupeKey: string;
  options: ShowEventNotificationOptions;
  source?: "game-statistics" | "ws";
}

/** @deprecated Use QueuedEventNotification */
export type QueuedProphetNotification = QueuedEventNotification;

interface NotificationWsPersistedState {
  queue: QueuedEventNotification[];
}

interface NotificationWsStore extends NotificationWsPersistedState {
  connectionStatus: ProphetWsConnectionStatus;
  isPresenting: boolean;
  recentDedupeKeys: string[];
  ongoingMatchSlug: string | null;
  enqueue: (data: ProphetNotificationData) => void;
  enqueueEventNotification: (
    options: ShowEventNotificationOptions,
    dedupeKey: string,
    source?: QueuedEventNotification["source"],
  ) => void;
  setOngoingMatchGate: (slug: string | null) => void;
  removeGameStatisticsNotifications: () => void;
  shiftAfterPresent: () => void;
  setPresenting: (value: boolean) => void;
  setConnectionStatus: (status: ProphetWsConnectionStatus) => void;
  clearQueue: () => void;
  reset: () => void;
}

const DEDUPE_WINDOW_SIZE = 200;

const initialPersistedState: NotificationWsPersistedState = {
  queue: [],
};

function createQueueItem(
  options: ShowEventNotificationOptions,
  dedupeKey: string,
  source?: QueuedEventNotification["source"],
): QueuedEventNotification {
  return {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    receivedAt: Date.now(),
    dedupeKey,
    options,
    source,
  };
}

function appendToQueue(
  get: () => NotificationWsStore,
  set: (
    partial:
      | Partial<NotificationWsStore>
      | ((state: NotificationWsStore) => Partial<NotificationWsStore>),
  ) => void,
  options: ShowEventNotificationOptions,
  dedupeKey: string,
  source?: QueuedEventNotification["source"],
) {
  const { recentDedupeKeys, queue, ongoingMatchSlug } = get();

  if (recentDedupeKeys.includes(dedupeKey)) {
    return;
  }

  if (source === "game-statistics" && !ongoingMatchSlug) {
    return;
  }

  const nextRecent = [...recentDedupeKeys, dedupeKey].slice(-DEDUPE_WINDOW_SIZE);

  set({
    queue: [...queue, createQueueItem(options, dedupeKey, source)],
    recentDedupeKeys: nextRecent,
  });
}

function isQueuedEventNotification(
  value: unknown,
): value is QueuedEventNotification {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<QueuedEventNotification>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.dedupeKey === "string" &&
    Boolean(candidate.options?.level) &&
    Array.isArray(candidate.options?.teams)
  );
}

export const useNotificationWsStore = create<NotificationWsStore>()(
  persist(
    (set, get) => ({
      ...initialPersistedState,
      connectionStatus: "idle",
      isPresenting: false,
      recentDedupeKeys: [],
      ongoingMatchSlug: null,

      enqueue: (data) => {
        const options = mapWsNotificationToEvent(data);

        if (!options) {
          return;
        }

        appendToQueue(
          get,
          set,
          options,
          buildNotificationDedupeKey(data),
          "ws",
        );
      },

      enqueueEventNotification: (options, dedupeKey, source = "game-statistics") => {
        appendToQueue(get, set, options, dedupeKey, source);
      },

      setOngoingMatchGate: (slug) => {
        set({ ongoingMatchSlug: slug });
      },

      removeGameStatisticsNotifications: () => {
        const { queue } = get();

        set({
          queue: queue.filter((item) => item.source !== "game-statistics"),
        });
      },

      shiftAfterPresent: () => {
        const { queue } = get();

        if (queue.length === 0) {
          return;
        }

        set({ queue: queue.slice(1) });
      },

      setPresenting: (value) => {
        set({ isPresenting: value });
      },

      setConnectionStatus: (status) => {
        set({ connectionStatus: status });
      },

      clearQueue: () => {
        set({ queue: [], recentDedupeKeys: [] });
      },

      reset: () => {
        set({
          ...initialPersistedState,
          connectionStatus: "idle",
          isPresenting: false,
          recentDedupeKeys: [],
          ongoingMatchSlug: null,
        });
      },
    }),
    {
      name: "wc-prophet-notifications",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        queue: state.queue,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as
          | Partial<NotificationWsPersistedState>
          | undefined;
        const persistedQueue = Array.isArray(persistedState?.queue)
          ? persistedState.queue.filter(isQueuedEventNotification)
          : current.queue;

        return {
          ...current,
          queue: persistedQueue,
        };
      },
    },
  ),
);
