"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  buildOpenOrderMarketMap,
  type OpenOrderMarketContext
} from "@/lib/portfolio/teams-condition";
import { getProphetTeamsCondition } from "@/service/prophet";
import type { ProphetTeamsConditionTeam } from "@/types/prophet-api";

interface TeamsConditionState {
  byConditionId: Record<string, ProphetTeamsConditionTeam[]>;
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

function buildContextMapForIds(
  byConditionId: Record<string, ProphetTeamsConditionTeam[]>,
  conditionIds: string[]
): Record<string, OpenOrderMarketContext> {
  const raw: Record<string, ProphetTeamsConditionTeam[]> = {};

  for (const id of conditionIds) {
    const teams = byConditionId[id];

    if (teams) {
      raw[id] = teams;
    }
  }

  return buildOpenOrderMarketMap(raw);
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
          : normalizedIds.filter((id) => !byConditionId[id]);

        if (missingIds.length === 0) {
          return buildContextMapForIds(byConditionId, normalizedIds);
        }

        const requestKey = [...missingIds].sort().join(",");

        let request = inFlightRequests.get(requestKey);

        if (!request) {
          request = (async () => {
            try {
              const teamsCondition = await getProphetTeamsCondition({
                condition_ids: missingIds.join(",")
              });

              set((state) => ({
                byConditionId: {
                  ...state.byConditionId,
                  ...teamsCondition
                }
              }));

              return buildOpenOrderMarketMap(teamsCondition);
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        byConditionId: state.byConditionId
      })
    }
  )
);
