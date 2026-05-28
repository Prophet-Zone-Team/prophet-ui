"use client";

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

import {
  mergeLiveSnapshot,
  mergeMatchWithLiveSnapshot,
  polymarketSportsWsUpdateToLivePatch,
  resolveMatchSlug,
  worldCupMatchToLiveSnapshot,
  type MatchLiveSnapshot,
} from "@/lib/market/sports-ws-live-state";
import type { PolymarketSportsWsUpdate } from "@/types/polymarket-sports-ws";
import type { WorldCupMatch, WorldCupMatchStatus } from "@/types/market";

interface MatchLiveState {
  bySlug: Record<string, MatchLiveSnapshot>;
  syncFromMatches: (matches: WorldCupMatch[]) => void;
  applyWsUpdate: (update: PolymarketSportsWsUpdate) => void;
}

function snapshotsEqual(
  left: MatchLiveSnapshot | undefined,
  right: MatchLiveSnapshot
): boolean {
  if (!left) {
    return false;
  }

  return (
    left.homeScore === right.homeScore &&
    left.awayScore === right.awayScore &&
    left.status === right.status &&
    left.liveElapsedSeconds === right.liveElapsedSeconds
  );
}

export const useMatchLiveStore = create<MatchLiveState>()((set, get) => ({
  bySlug: {},
  syncFromMatches: (matches) => {
    if (matches.length === 0) {
      return;
    }

    const next = { ...get().bySlug };
    let changed = false;

    for (const match of matches) {
      const slug = resolveMatchSlug(match);

      if (!slug) {
        continue;
      }

      const snapshot = worldCupMatchToLiveSnapshot(match);

      if (!snapshotsEqual(next[slug], snapshot)) {
        next[slug] = snapshot;
        changed = true;
      }
    }

    if (changed) {
      set({ bySlug: next });
    }
  },
  applyWsUpdate: (update) => {
    const slug = update.slug;
    const current = get().bySlug[slug];
    const patch = polymarketSportsWsUpdateToLivePatch(update, current);
    const merged = mergeLiveSnapshot(current, patch);

    if (!merged) {
      return;
    }

    if (snapshotsEqual(current, merged)) {
      return;
    }

    set({
      bySlug: {
        ...get().bySlug,
        [slug]: merged,
      },
    });
  },
}));

export function useMatchLiveSnapshot(
  slug: string | undefined
): MatchLiveSnapshot | undefined {
  return useMatchLiveStore((state) =>
    slug ? state.bySlug[slug] : undefined
  );
}

export function useMatchWithLiveState(match: WorldCupMatch): WorldCupMatch {
  const slug = resolveMatchSlug(match);
  const snapshot = useMatchLiveStore((state) =>
    slug ? state.bySlug[slug] : undefined
  );

  return mergeMatchWithLiveSnapshot(match, snapshot);
}

export function useMatchLiveScore(slug: string | undefined): {
  homeScore?: number;
  awayScore?: number;
  status: WorldCupMatchStatus;
} {
  return useMatchLiveStore(
    useShallow((state) => {
      const snapshot = slug ? state.bySlug[slug] : undefined;

      return {
        homeScore: snapshot?.homeScore,
        awayScore: snapshot?.awayScore,
        status: snapshot?.status ?? "unknown",
      };
    })
  );
}
