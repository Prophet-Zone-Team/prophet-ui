"use client";

import { useMemo } from "react";

import {
  comboGameGroupToWorldCupMatch,
  mergeComboGroupWithLiveSnapshot,
  resolveComboGroupLiveKeys,
} from "@/lib/combo/combo-game-live-state";
import type { MatchLiveSnapshot } from "@/lib/market/sports-ws-live-state";
import { useMatchLiveStore } from "@/store/match-live-store";
import type { ComboGameGroup } from "@/types/combo";

function findSnapshot(
  bySlug: Record<string, MatchLiveSnapshot>,
  keys: string[],
): MatchLiveSnapshot | undefined {
  for (const key of keys) {
    const snapshot = bySlug[key];

    if (snapshot) {
      return snapshot;
    }
  }

  return undefined;
}

export function useComboGroupsWithLiveState(
  groups: ComboGameGroup[],
): ComboGameGroup[] {
  const bySlug = useMatchLiveStore((state) => state.bySlug);

  return useMemo(
    () =>
      groups.map((group) =>
        mergeComboGroupWithLiveSnapshot(
          group,
          findSnapshot(bySlug, resolveComboGroupLiveKeys(group)),
        ),
      ),
    [groups, bySlug],
  );
}

export function comboGroupsToWorldCupMatches(
  groups: ComboGameGroup[],
): ReturnType<typeof comboGameGroupToWorldCupMatch>[] {
  return groups.map(comboGameGroupToWorldCupMatch);
}
