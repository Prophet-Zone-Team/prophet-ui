"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { getWorldCupTeamByIdOrCode } from "@/data/world-cup-2026/groups";
import {
  normalizeKnockoutMethod,
  type KnockoutMethodKey,
} from "@/views/road-to-final/lib/method-keys";
import { defaultSimulatorTeamId } from "@/views/road-to-final/lib/teams";
import type { KnockoutWinners } from "@/views/road-to-final/types";

export const ROAD_TO_FINAL_STORAGE_KEY = "prophet:road-to-final:state";

type PersistedRoadToFinalState = {
  teamId: string;
  knockoutWinners: KnockoutWinners;
  knockoutMethod: KnockoutMethodKey;
};

function sanitizeKnockoutWinners(
  winners: KnockoutWinners | Record<string, string> | undefined
): KnockoutWinners {
  if (!winners) {
    return {};
  }

  const sanitized: KnockoutWinners = {};

  for (const [matchId, teamId] of Object.entries(winners)) {
    if (getWorldCupTeamByIdOrCode(teamId)) {
      sanitized[Number(matchId)] = teamId;
    }
  }

  return sanitized;
}

function sanitizePersistedState(
  state: Partial<PersistedRoadToFinalState> | undefined
): PersistedRoadToFinalState {
  const team = state?.teamId
    ? getWorldCupTeamByIdOrCode(state.teamId)
    : undefined;

  return {
    teamId: team?.id ?? defaultSimulatorTeamId,
    knockoutWinners: sanitizeKnockoutWinners(state?.knockoutWinners),
    knockoutMethod: normalizeKnockoutMethod(state?.knockoutMethod ?? ""),
  };
}

interface RoadToFinalStoreState extends PersistedRoadToFinalState {
  setTeamId: (teamId: string) => void;
  setKnockoutWinners: (winners: KnockoutWinners) => void;
  setKnockoutMethod: (method: KnockoutMethodKey) => void;
  applySharedState: (state: {
    teamId?: string;
    knockoutWinners?: KnockoutWinners;
    knockoutMethod?: string;
  }) => void;
  clearKnockoutSelections: () => void;
}

export const useRoadToFinalStore = create<RoadToFinalStoreState>()(
  persist(
    (set) => ({
      teamId: defaultSimulatorTeamId,
      knockoutWinners: {},
      knockoutMethod: "manualSelection",
      setTeamId: (teamId) => {
        const team = getWorldCupTeamByIdOrCode(teamId);

        if (team) {
          set({ teamId: team.id });
        }
      },
      setKnockoutWinners: (knockoutWinners) => {
        set({ knockoutWinners: sanitizeKnockoutWinners(knockoutWinners) });
      },
      setKnockoutMethod: (knockoutMethod) => {
        set({ knockoutMethod });
      },
      applySharedState: (state) => {
        set((current) => {
          const team = state.teamId
            ? getWorldCupTeamByIdOrCode(state.teamId)
            : undefined;

          return {
            teamId: team?.id ?? current.teamId,
            knockoutWinners:
              state.knockoutWinners !== undefined
                ? sanitizeKnockoutWinners(state.knockoutWinners)
                : current.knockoutWinners,
            knockoutMethod: state.knockoutMethod
              ? normalizeKnockoutMethod(state.knockoutMethod)
              : current.knockoutMethod,
          };
        });
      },
      clearKnockoutSelections: () => {
        set({ knockoutWinners: {}, knockoutMethod: "manualSelection" });
      },
    }),
    {
      name: ROAD_TO_FINAL_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        teamId: state.teamId,
        knockoutWinners: state.knockoutWinners,
        knockoutMethod: state.knockoutMethod,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...sanitizePersistedState(
          persisted as Partial<PersistedRoadToFinalState> | undefined
        ),
      }),
    }
  )
);

export function hasPersistedRoadToFinalStorage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(ROAD_TO_FINAL_STORAGE_KEY) !== null;
}

function subscribeRoadToFinalHydration(onStoreChange: () => void) {
  return useRoadToFinalStore.persist.onFinishHydration(onStoreChange);
}

function getRoadToFinalHydrationSnapshot() {
  return useRoadToFinalStore.persist.hasHydrated();
}

function getRoadToFinalHydrationServerSnapshot() {
  return false;
}

/** Wait until persist has rehydrated from localStorage before syncing URL state. */
export function useRoadToFinalHydrated() {
  return useSyncExternalStore(
    subscribeRoadToFinalHydration,
    getRoadToFinalHydrationSnapshot,
    getRoadToFinalHydrationServerSnapshot
  );
}
