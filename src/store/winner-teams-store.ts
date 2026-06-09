"use client";

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

import { FIFA_WINNER_EVENT_PATH } from "@/config/fifa-winner-market";
import { buildStaticWinnerSnapshots } from "@/lib/market/build-static-winner-snapshots";
import { fetchPolymarket } from "@/lib/market/polymarket-api-client";
import type { GammaEventRecord } from "@/lib/market/polymarket-gamma";
import {
  mapWinnerEventToStorePatch,
  parseWinnerGammaEvent,
  type WinnerTeamMarketDynamic,
} from "@/lib/market/winner-event-mapper";
import { sortHomeTeams } from "@/views/home/home-hero-stats";
import type { TeamMarketSnapshot } from "@/types/market";

export type WinnerTeamsStatus = "idle" | "loading" | "ready" | "error";

interface WinnerTeamsState {
  status: WinnerTeamsStatus;
  error?: string;
  eventVolume?: number;
  lastUpdated?: string;
  byTeamId: Record<string, WinnerTeamMarketDynamic>;
  fetchEvent: () => Promise<void>;
}

const staticSnapshots = buildStaticWinnerSnapshots();

let fetchPromise: Promise<void> | undefined;

export const useWinnerTeamsStore = create<WinnerTeamsState>()((set, get) => ({
  status: "idle",
  byTeamId: {},
  fetchEvent: async () => {
    const currentStatus = get().status;

    if (currentStatus === "loading") {
      return fetchPromise;
    }

    if (currentStatus === "ready") {
      return;
    }

    set({ status: "loading", error: undefined });

    fetchPromise = (async () => {
      try {
        const payload = await fetchPolymarket<GammaEventRecord>(FIFA_WINNER_EVENT_PATH);
        const event = parseWinnerGammaEvent(payload);

        if (!event) {
          throw new Error("Polymarket returned an unexpected winner event payload.");
        }

        const patch = mapWinnerEventToStorePatch(event);

        set({
          status: "ready",
          error: undefined,
          eventVolume: patch.eventVolume,
          lastUpdated: patch.lastUpdated,
          byTeamId: patch.byTeamId,
        });
      } catch (error) {
        set({
          status: "error",
          error: error instanceof Error ? error.message : "Failed to load winner markets.",
        });
      } finally {
        fetchPromise = undefined;
      }
    })();

    return fetchPromise;
  },
}));

function mergeWinnerSnapshots(
  byTeamId: Record<string, WinnerTeamMarketDynamic>,
  sortByProbability: boolean,
): TeamMarketSnapshot[] {
  const mergedByTeamId = new Map<string, TeamMarketSnapshot>();

  for (const snapshot of staticSnapshots) {
    const dynamic = byTeamId[snapshot.team.id];

    mergedByTeamId.set(snapshot.team.id, {
      team: snapshot.team,
      market: dynamic
        ? {
            teamId: snapshot.team.id,
            ...dynamic,
          }
        : snapshot.market,
    });
  }

  const merged = [...mergedByTeamId.values()];

  return sortByProbability ? sortHomeTeams(merged) : merged;
}

export function useWinnerSnapshots(): TeamMarketSnapshot[] {
  const { status, byTeamId } = useWinnerTeamsStore(
    useShallow((state) => ({
      status: state.status,
      byTeamId: state.byTeamId,
    })),
  );

  return mergeWinnerSnapshots(byTeamId, status === "ready");
}

export function useWinnerEventVolume(): number | undefined {
  return useWinnerTeamsStore((state) => state.eventVolume);
}

export function useWinnerTeamsStatus(): WinnerTeamsStatus {
  return useWinnerTeamsStore((state) => state.status);
}

export function useWinnerTeamsError(): string | undefined {
  return useWinnerTeamsStore((state) => state.error);
}

export function useWinnerTeamsLastUpdated(): string | undefined {
  return useWinnerTeamsStore((state) => state.lastUpdated);
}

export function useWinnerMarketDataMeta() {
  const status = useWinnerTeamsStatus();
  const error = useWinnerTeamsError();
  const lastUpdated = useWinnerTeamsLastUpdated();

  return {
    source: "polymarket" as const,
    status:
      status === "ready"
        ? ("live" as const)
        : status === "error"
          ? ("error" as const)
          : status === "loading"
            ? ("partial" as const)
            : ("partial" as const),
    lastUpdated: lastUpdated ?? new Date().toISOString(),
    stale: status !== "ready",
    error,
  };
}
