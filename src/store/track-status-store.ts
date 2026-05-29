"use client";

import { create } from "zustand";

import {
  buildTrackStatusMapFromApiItems,
  type ProphetTrackStatusItem
} from "@/lib/tracks/track-status-keys";

interface TrackStatusState {
  byKey: Record<string, boolean>;
  setTracked: (key: string, tracked: boolean) => void;
  hydrateFromApiItems: (items: ProphetTrackStatusItem[]) => void;
  clearAll: () => void;
}

export const useTrackStatusStore = create<TrackStatusState>()((set) => ({
  byKey: {},
  setTracked: (key, tracked) => {
    set((state) => {
      if (!tracked) {
        if (!(key in state.byKey)) {
          return state;
        }

        const nextByKey = { ...state.byKey };
        delete nextByKey[key];

        return { byKey: nextByKey };
      }

      if (state.byKey[key] === true) {
        return state;
      }

      return {
        byKey: {
          ...state.byKey,
          [key]: true
        }
      };
    });
  },
  hydrateFromApiItems: (items) => {
    set({ byKey: buildTrackStatusMapFromApiItems(items) });
  },
  clearAll: () => set({ byKey: {} })
}));

export function useIsTrackKeyTracked(key: string): boolean {
  return useTrackStatusStore((state) => state.byKey[key] === true);
}
