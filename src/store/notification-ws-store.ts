"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { buildNotificationDedupeKey } from "@/lib/notification/map-ws-notification-to-event";
import type { ProphetNotificationData } from "@/types/prophet-notification-ws";
import type { ProphetWsConnectionStatus } from "@/types/prophet-notification-ws";

export interface QueuedProphetNotification {
  id: string;
  receivedAt: number;
  dedupeKey: string;
  data: ProphetNotificationData;
}

interface NotificationWsPersistedState {
  queue: QueuedProphetNotification[];
}

interface NotificationWsStore extends NotificationWsPersistedState {
  connectionStatus: ProphetWsConnectionStatus;
  isPresenting: boolean;
  recentDedupeKeys: string[];
  enqueue: (data: ProphetNotificationData) => void;
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

function createQueueItem(data: ProphetNotificationData): QueuedProphetNotification {
  return {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    receivedAt: Date.now(),
    dedupeKey: buildNotificationDedupeKey(data),
    data,
  };
}

export const useNotificationWsStore = create<NotificationWsStore>()(
  persist(
    (set, get) => ({
      ...initialPersistedState,
      connectionStatus: "idle",
      isPresenting: false,
      recentDedupeKeys: [],

      enqueue: (data) => {
        const dedupeKey = buildNotificationDedupeKey(data);
        const { recentDedupeKeys, queue } = get();

        if (recentDedupeKeys.includes(dedupeKey)) {
          return;
        }

        const nextRecent = [...recentDedupeKeys, dedupeKey].slice(
          -DEDUPE_WINDOW_SIZE,
        );

        set({
          queue: [...queue, createQueueItem(data)],
          recentDedupeKeys: nextRecent,
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

        return {
          ...current,
          queue: persistedState?.queue ?? current.queue,
        };
      },
    },
  ),
);
