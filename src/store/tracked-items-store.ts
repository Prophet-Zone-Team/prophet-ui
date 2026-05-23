"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface TrackedItemsState {
  teamIds: string[];
  matchIds: string[];
  toggleTeam: (teamId: string) => void;
  toggleMatch: (matchId: string) => void;
  clearTrackedTeams: () => void;
  clearTrackedMatches: () => void;
}

function toggleId(ids: string[], id: string): string[] {
  if (ids.includes(id)) {
    return ids.filter((item) => item !== id);
  }

  return [...ids, id];
}

export const useTrackedItemsStore = create<TrackedItemsState>()(
  persist(
    (set, get) => ({
      teamIds: [],
      matchIds: [],
      toggleTeam: (teamId) => {
        set({ teamIds: toggleId(get().teamIds, teamId) });
      },
      toggleMatch: (matchId) => {
        set({ matchIds: toggleId(get().matchIds, matchId) });
      },
      clearTrackedTeams: () => set({ teamIds: [] }),
      clearTrackedMatches: () => set({ matchIds: [] })
    }),
    {
      name: "tracks",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        teamIds: state.teamIds,
        matchIds: state.matchIds
      }),
      migrate: (persisted) => {
        const state = persisted as
          | { teamIds?: string[]; matchIds?: string[] }
          | undefined;

        return {
          teamIds: state?.teamIds ?? [],
          matchIds: state?.matchIds ?? []
        };
      }
    }
  )
);

/** @deprecated Use useTrackedItemsStore */
export const useTrackedTeamsStore = useTrackedItemsStore;

export function useIsTeamTracked(teamId: string) {
  return useTrackedItemsStore((state) => state.teamIds.includes(teamId));
}

export function useIsMatchTracked(matchId: string) {
  return useTrackedItemsStore((state) => state.matchIds.includes(matchId));
}

export function useTrackedTeamIds() {
  return useTrackedItemsStore((state) => state.teamIds);
}

export function useTrackedMatchIds() {
  return useTrackedItemsStore((state) => state.matchIds);
}

export function useToggleTrackedTeam() {
  return useTrackedItemsStore((state) => state.toggleTeam);
}

export function useToggleTrackedMatch() {
  return useTrackedItemsStore((state) => state.toggleMatch);
}
