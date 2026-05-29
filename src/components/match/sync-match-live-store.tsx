"use client";

import { useEffect, useMemo } from "react";

import { resolveMatchLiveKeys } from "@/lib/market/sports-ws-live-state";
import { useMatchLiveStore } from "@/store/match-live-store";
import type { WorldCupMatch } from "@/types/market";

export interface SyncMatchLiveStoreProps {
  matches: WorldCupMatch[];
}

export function SyncMatchLiveStore({ matches }: SyncMatchLiveStoreProps) {
  const syncFromMatches = useMatchLiveStore((state) => state.syncFromMatches);
  const matchesKey = useMemo(
    () =>
      matches
        .map(
          (match) =>
            `${resolveMatchLiveKeys(match).join("/")}:${match.homeScore ?? ""}:${match.awayScore ?? ""}:${match.status}:${match.liveElapsedSeconds ?? ""}`
        )
        .join("|"),
    [matches]
  );

  useEffect(() => {
    syncFromMatches(matches);
  }, [matches, matchesKey, syncFromMatches]);

  return null;
}
