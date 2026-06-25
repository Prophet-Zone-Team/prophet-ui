"use client";

import { useEffect, useMemo } from "react";

import { comboGameGroupToWorldCupMatch, resolveComboGroupLiveKeys } from "@/lib/combo/combo-game-live-state";
import { useMatchLiveStore } from "@/store/match-live-store";
import type { ComboGameGroup } from "@/types/combo";

export interface SyncComboLiveStoreProps {
  groups: ComboGameGroup[];
}

export function SyncComboLiveStore({ groups }: SyncComboLiveStoreProps) {
  const syncFromMatches = useMatchLiveStore((state) => state.syncFromMatches);
  const groupsKey = useMemo(
    () =>
      groups
        .map(
          (group) =>
            `${resolveComboGroupLiveKeys(group).join("/")}:${group.homeScore ?? ""}:${group.awayScore ?? ""}:${group.status}`,
        )
        .join("|"),
    [groups],
  );

  useEffect(() => {
    syncFromMatches(groups.map(comboGameGroupToWorldCupMatch));
  }, [groups, groupsKey, syncFromMatches]);

  return null;
}
