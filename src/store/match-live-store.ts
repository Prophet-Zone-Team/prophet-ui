"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

import { applyScoreChangeToGoalEvents } from "@/lib/market/match-goal-events";
import { findFeaturedScheduleMatch } from "@/lib/market/schedule-match";
import {
  loadMatchLiveSession,
  saveMatchLiveSession,
} from "@/lib/market/match-live-session";
import {
  mergeLiveSnapshot,
  mergeMatchWithLiveSnapshot,
  parseSportsElapsedSeconds,
  polymarketSportsWsUpdateToLivePatch,
  resolveMatchLiveKeys,
  resolveWsUpdateKey,
  worldCupMatchToLiveSnapshot,
  type MatchLiveSnapshot,
} from "@/lib/market/sports-ws-live-state";
import { parseMatchScoreString } from "@/lib/market/parse-match-score";
import type { PolymarketSportsWsUpdate } from "@/types/polymarket-sports-ws";
import type {
  GameMatchChartEvent,
  WorldCupMatch,
  WorldCupMatchStatus,
} from "@/types/market";

interface MatchLiveState {
  /** Snapshots keyed by fixture slug and/or event id. */
  bySlug: Record<string, MatchLiveSnapshot>;
  /** Maps event ids to their canonical fixture slug when both are known. */
  eventIdToSlug: Record<string, string>;
  hydrated: boolean;
  hydrateFromSession: () => void;
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
    left.period === right.period &&
    left.liveElapsedSeconds === right.liveElapsedSeconds &&
    left.liveElapsedUnavailable === right.liveElapsedUnavailable &&
    left.trackedHomeScore === right.trackedHomeScore &&
    left.trackedAwayScore === right.trackedAwayScore &&
    JSON.stringify(left.goalEvents ?? []) === JSON.stringify(right.goalEvents ?? [])
  );
}

function findSnapshot(
  bySlug: Record<string, MatchLiveSnapshot>,
  keys: string[]
): MatchLiveSnapshot | undefined {
  for (const key of keys) {
    const snapshot = bySlug[key];

    if (snapshot) {
      return snapshot;
    }
  }

  return undefined;
}

function collectAliasKeys(
  state: MatchLiveState,
  primaryKey: string
): string[] {
  const keys = new Set<string>([primaryKey]);
  const canonicalSlug = state.eventIdToSlug[primaryKey];

  if (canonicalSlug) {
    keys.add(canonicalSlug);
  }

  for (const [eventId, slug] of Object.entries(state.eventIdToSlug)) {
    if (eventId === primaryKey || slug === primaryKey) {
      keys.add(eventId);
      keys.add(slug);
    }
  }

  return [...keys];
}

function writeSnapshot(
  state: MatchLiveState,
  keys: string[],
  snapshot: MatchLiveSnapshot
): Pick<MatchLiveState, "bySlug" | "eventIdToSlug"> {
  const nextBySlug = { ...state.bySlug };

  for (const key of keys) {
    nextBySlug[key] = snapshot;
  }

  return {
    bySlug: nextBySlug,
    eventIdToSlug: state.eventIdToSlug,
  };
}

function seedTrackedScores(snapshot: MatchLiveSnapshot): MatchLiveSnapshot {
  const trackedHomeScore = snapshot.trackedHomeScore ?? snapshot.homeScore ?? 0;
  const trackedAwayScore = snapshot.trackedAwayScore ?? snapshot.awayScore ?? 0;

  return {
    ...snapshot,
    goalEvents: snapshot.goalEvents ?? [],
    trackedHomeScore,
    trackedAwayScore,
  };
}

function mergeSnapshotFromMatch(
  current: MatchLiveSnapshot | undefined,
  next: MatchLiveSnapshot
): MatchLiveSnapshot {
  if (!current) {
    return seedTrackedScores(next);
  }

  return seedTrackedScores({
    ...current,
    ...next,
    period: next.period ?? current.period,
    liveElapsedSeconds:
      next.liveElapsedSeconds !== undefined
        ? next.liveElapsedSeconds
        : current.liveElapsedUnavailable
          ? undefined
          : current.liveElapsedSeconds,
    liveElapsedUnavailable:
      next.liveElapsedSeconds !== undefined
        ? false
        : current.liveElapsedUnavailable,
    goalEvents: current.goalEvents ?? [],
    trackedHomeScore: current.trackedHomeScore ?? next.trackedHomeScore,
    trackedAwayScore: current.trackedAwayScore ?? next.trackedAwayScore,
  });
}

function resolveGoalEventElapsedSeconds(
  update: PolymarketSportsWsUpdate,
  snapshot: MatchLiveSnapshot,
): number | undefined {
  return (
    parseSportsElapsedSeconds(update.elapsed) ?? snapshot.liveElapsedSeconds
  );
}

function buildSnapshotForGoalDetection(
  current: MatchLiveSnapshot | undefined,
  merged: MatchLiveSnapshot,
): MatchLiveSnapshot {
  const seeded = seedTrackedScores(merged);

  return {
    ...seeded,
    goalEvents: current?.goalEvents ?? [],
    trackedHomeScore: current?.trackedHomeScore ?? current?.homeScore ?? 0,
    trackedAwayScore: current?.trackedAwayScore ?? current?.awayScore ?? 0,
    homeScore: merged.homeScore,
    awayScore: merged.awayScore,
    liveElapsedSeconds:
      merged.liveElapsedSeconds ?? current?.liveElapsedSeconds,
  };
}

function applyGoalEventsFromWsUpdate(
  snapshot: MatchLiveSnapshot,
  update: PolymarketSportsWsUpdate
): MatchLiveSnapshot {
  if (!update.score) {
    return snapshot;
  }

  const parsedScore = parseMatchScoreString(update.score);
  const homeScore = parsedScore.homeScore;
  const awayScore = parsedScore.awayScore;

  if (homeScore === undefined || awayScore === undefined) {
    return snapshot;
  }

  const elapsedSeconds = resolveGoalEventElapsedSeconds(update, snapshot);

  if (elapsedSeconds === undefined) {
    return snapshot;
  }

  const trackedHomeScore = snapshot.trackedHomeScore ?? 0;
  const trackedAwayScore = snapshot.trackedAwayScore ?? 0;

  if (homeScore === trackedHomeScore && awayScore === trackedAwayScore) {
    return snapshot;
  }

  const goalResult = applyScoreChangeToGoalEvents({
    trackedHomeScore,
    trackedAwayScore,
    homeScore,
    awayScore,
    elapsedSeconds,
    existingEvents: snapshot.goalEvents ?? [],
  });

  if (goalResult.addedEvents.length === 0) {
    return {
      ...snapshot,
      trackedHomeScore: goalResult.trackedHomeScore,
      trackedAwayScore: goalResult.trackedAwayScore,
    };
  }

  return {
    ...snapshot,
    goalEvents: goalResult.events,
    trackedHomeScore: goalResult.trackedHomeScore,
    trackedAwayScore: goalResult.trackedAwayScore,
  };
}

function persistState(state: Pick<MatchLiveState, "bySlug" | "eventIdToSlug">) {
  saveMatchLiveSession({
    bySlug: state.bySlug,
    eventIdToSlug: state.eventIdToSlug,
  });
}

export const useMatchLiveStore = create<MatchLiveState>()((set, get) => ({
  bySlug: {},
  eventIdToSlug: {},
  hydrated: false,
  hydrateFromSession: () => {
    if (get().hydrated) {
      return;
    }

    const persisted = loadMatchLiveSession();

    if (persisted) {
      set({
        bySlug: persisted.bySlug,
        eventIdToSlug: persisted.eventIdToSlug,
        hydrated: true,
      });
      return;
    }

    set({ hydrated: true });
  },
  syncFromMatches: (matches) => {
    if (matches.length === 0) {
      return;
    }

    let nextBySlug = { ...get().bySlug };
    let nextEventIdToSlug = { ...get().eventIdToSlug };
    let changed = false;

    for (const match of matches) {
      const keys = resolveMatchLiveKeys(match);

      if (keys.length === 0) {
        continue;
      }

      const slug = keys[0];
      const eventId = keys.find((key) => key !== slug);

      if (slug && eventId && nextEventIdToSlug[eventId] !== slug) {
        nextEventIdToSlug[eventId] = slug;
        changed = true;
      }

      const snapshot = worldCupMatchToLiveSnapshot(match);
      const current = findSnapshot(nextBySlug, keys);
      const merged = mergeSnapshotFromMatch(current, snapshot);

      if (!snapshotsEqual(current, merged)) {
        for (const key of keys) {
          nextBySlug[key] = merged;
        }

        changed = true;
      }
    }

    if (changed) {
      const nextState = {
        bySlug: nextBySlug,
        eventIdToSlug: nextEventIdToSlug,
      };

      set(nextState);
      persistState(nextState);
    }
  },
  applyWsUpdate: (update) => {
    const updateKey = resolveWsUpdateKey(update);

    if (!updateKey) {
      return;
    }

    const state = get();
    const canonicalSlug = update.slug?.trim() || state.eventIdToSlug[updateKey];
    const lookupKeys = canonicalSlug
      ? [canonicalSlug, updateKey]
      : [updateKey];
    const current = findSnapshot(state.bySlug, lookupKeys);
    const patch = polymarketSportsWsUpdateToLivePatch(update, current);
    const merged = mergeLiveSnapshot(current, patch);

    if (!merged) {
      return;
    }

    const withGoals = applyGoalEventsFromWsUpdate(
      buildSnapshotForGoalDetection(current, merged),
      update,
    );

    if (snapshotsEqual(current, withGoals)) {
      return;
    }

    const writeKeys = new Set(collectAliasKeys(state, updateKey));
    writeKeys.add(updateKey);

    if (canonicalSlug) {
      writeKeys.add(canonicalSlug);
    }

    const nextEventIdToSlug = { ...state.eventIdToSlug };

    if (update.slug?.trim() && updateKey !== update.slug.trim()) {
      nextEventIdToSlug[updateKey] = update.slug.trim();
    } else if (canonicalSlug && updateKey !== canonicalSlug) {
      nextEventIdToSlug[updateKey] = canonicalSlug;
    }

    const nextState = {
      ...writeSnapshot(
        { ...state, eventIdToSlug: nextEventIdToSlug },
        [...writeKeys],
        withGoals
      ),
      eventIdToSlug: nextEventIdToSlug,
    };

    set(nextState);
    persistState(nextState);
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
  const keys = resolveMatchLiveKeys(match);
  const snapshot = useMatchLiveStore((state) =>
    findSnapshot(state.bySlug, keys)
  );

  return mergeMatchWithLiveSnapshot(match, snapshot);
}

export function useMatchGoalChartEvents(
  match: WorldCupMatch
): GameMatchChartEvent[] {
  const keys = resolveMatchLiveKeys(match);

  return useMatchLiveStore(
    useShallow((state) => {
      const snapshot = findSnapshot(state.bySlug, keys);
      return snapshot?.goalEvents ?? [];
    })
  );
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

export function useScheduleMatchesWithLiveState(
  matches: WorldCupMatch[]
): WorldCupMatch[] {
  const bySlug = useMatchLiveStore((state) => state.bySlug);

  return useMemo(
    () =>
      matches.map((match) =>
        mergeMatchWithLiveSnapshot(
          match,
          findSnapshot(bySlug, resolveMatchLiveKeys(match))
        )
      ),
    [matches, bySlug]
  );
}

export function useFeaturedScheduleMatch(
  matches: WorldCupMatch[]
): WorldCupMatch | undefined {
  const matchesWithLive = useScheduleMatchesWithLiveState(matches);

  return useMemo(
    () => findFeaturedScheduleMatch(matchesWithLive, { showEnded: false }),
    [matchesWithLive]
  );
}
