"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { fetchGammaMarketsInformation } from "@/lib/market/gamma-markets-information";
import { mapGammaMarketsToTeamsConditionData } from "@/lib/portfolio/map-gamma-portfolio-market";
import {
  buildOpenOrderMarketMap,
  type OpenOrderMarketContext
} from "@/lib/portfolio/teams-condition";
import type {
  ProphetTeamsConditionEntry,
  ProphetTeamsConditionTeam
} from "@/types/prophet-api";

interface TeamsConditionState {
  byConditionId: Record<string, ProphetTeamsConditionEntry>;
  ensureTeamsCondition: (
    conditionIds: string[],
    options?: { force?: boolean }
  ) => Promise<Record<string, OpenOrderMarketContext>>;
}

const inFlightRequests = new Map<
  string,
  Promise<Record<string, OpenOrderMarketContext>>
>();

function normalizeConditionIds(conditionIds: string[]): string[] {
  const ids = new Set<string>();

  for (const id of conditionIds) {
    const trimmed = id.trim();

    if (trimmed) {
      ids.add(trimmed);
    }
  }

  return [...ids];
}

function needsTeamsConditionFetch(
  entry: ProphetTeamsConditionEntry | undefined
): boolean {
  if (!entry) {
    return true;
  }

  if (!entry.slug?.trim()) {
    return true;
  }

  if (!entry.question?.trim()) {
    return true;
  }

  return !entry.marketKind;
}

function buildContextMapForIds(
  byConditionId: Record<string, ProphetTeamsConditionEntry>,
  conditionIds: string[]
): Record<string, OpenOrderMarketContext> {
  const raw: Record<string, ProphetTeamsConditionEntry> = {};

  for (const id of conditionIds) {
    const entry = byConditionId[id];

    if (entry) {
      raw[id] = entry;
    }
  }

  return buildOpenOrderMarketMap(raw);
}

function migrateTeamsConditionEntry(
  value: unknown
): ProphetTeamsConditionEntry | undefined {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return {
      teams: value as ProphetTeamsConditionTeam[],
      slug: ""
    };
  }

  if (typeof value === "object") {
    const entry = value as Partial<ProphetTeamsConditionEntry>;
    const teams = Array.isArray(entry.teams) ? entry.teams : [];
    const marketKind = entry.marketKind;

    return {
      teams,
      slug: typeof entry.slug === "string" ? entry.slug : "",
      question: typeof entry.question === "string" ? entry.question : "",
      main_event_title:
        typeof entry.main_event_title === "string"
          ? entry.main_event_title
          : "",
      event_title:
        typeof entry.event_title === "string" ? entry.event_title : "",
      icon: typeof entry.icon === "string" ? entry.icon : undefined,
      marketKind:
        marketKind === "team" ||
        marketKind === "game" ||
        marketKind === "group"
          ? marketKind
          : undefined
    };
  }

  return undefined;
}

function migrateByConditionId(
  byConditionId: unknown
): Record<string, ProphetTeamsConditionEntry> {
  if (!byConditionId || typeof byConditionId !== "object") {
    return {};
  }

  const migrated: Record<string, ProphetTeamsConditionEntry> = {};

  for (const [conditionId, value] of Object.entries(byConditionId)) {
    const entry = migrateTeamsConditionEntry(value);

    if (entry) {
      migrated[conditionId] = entry;
    }
  }

  return migrated;
}

export const useTeamsConditionStore = create<TeamsConditionState>()(
  persist(
    (set, get) => ({
      byConditionId: {},

      ensureTeamsCondition: async (conditionIds, options) => {
        const normalizedIds = normalizeConditionIds(conditionIds);

        if (normalizedIds.length === 0) {
          return {};
        }

        const { byConditionId } = get();
        const missingIds = options?.force
          ? normalizedIds
          : normalizedIds.filter((id) =>
              needsTeamsConditionFetch(byConditionId[id])
            );

        if (missingIds.length === 0) {
          return buildContextMapForIds(byConditionId, normalizedIds);
        }

        const requestKey = [...missingIds].sort().join(",");

        let request = inFlightRequests.get(requestKey);

        if (!request) {
          request = (async () => {
            try {
              const markets = await fetchGammaMarketsInformation(missingIds);
              const teamsCondition =
                mapGammaMarketsToTeamsConditionData(markets);

              set((state) => ({
                byConditionId: {
                  ...state.byConditionId,
                  ...teamsCondition
                }
              }));

              return buildOpenOrderMarketMap(teamsCondition);
            } catch (error) {
              console.warn(
                "[teams-condition-store] Gamma markets/information failed:",
                error
              );

              return buildContextMapForIds(get().byConditionId, missingIds);
            } finally {
              inFlightRequests.delete(requestKey);
            }
          })();

          inFlightRequests.set(requestKey, request);
        }

        await request;

        return buildContextMapForIds(get().byConditionId, normalizedIds);
      }
    }),
    {
      name: "wc-teams-condition",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        byConditionId: state.byConditionId
      }),
      migrate: (persisted, version) => {
        if (version < 3) {
          return { byConditionId: {} };
        }

        const state = persisted as { byConditionId?: unknown } | undefined;

        return { byConditionId: migrateByConditionId(state?.byConditionId) };
      }
    }
  )
);
