"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { FootballMatchesResult } from "@/data/providers/football-matches";
import { mapProphetGamesToMatches } from "@/lib/market/prophet-game-mapper";
import { marketQueryKeys } from "@/lib/market/query-keys";
import { getProphetGames } from "@/service/prophet";
import type { FreshnessMeta, WorldCupMatch } from "@/types/market";

const FOOTBALL_MATCHES_STALE_TIME_MS = 30_000;

export function useFootballMatches(params: {
  league: string;
  ended: boolean;
  initialMatches?: WorldCupMatch[];
  initialMeta?: FreshnessMeta;
  enabled?: boolean;
}) {
  const {
    league,
    ended,
    initialMatches,
    initialMeta,
    enabled = true
  } = params;

  const initialData =
    !ended && initialMatches
      ? ({
          matches: initialMatches,
          meta:
            initialMeta ??
            ({
              source: "prophet-api",
              status: initialMatches.length > 0 ? "live" : "unavailable",
              lastUpdated: new Date().toISOString()
            } satisfies FreshnessMeta)
        } satisfies FootballMatchesResult)
      : undefined;

  const query = useQuery({
    queryKey: marketQueryKeys.footballMatches(league, ended),
    queryFn: async (): Promise<FootballMatchesResult> => {
      const lastUpdated = new Date().toISOString();
      const { list } = await getProphetGames({ league, ended });
      const matches = mapProphetGamesToMatches(list ?? []);

      return {
        matches,
        meta: {
          source: "prophet-api",
          status: matches.length > 0 ? "live" : "unavailable",
          lastUpdated
        }
      };
    },
    enabled: enabled && league.trim().length > 0,
    staleTime: FOOTBALL_MATCHES_STALE_TIME_MS,
    initialData,
    initialDataUpdatedAt: initialData ? Date.now() : undefined
  });

  const matches = useMemo(
    () => query.data?.matches ?? [],
    [query.data?.matches]
  );

  return {
    matches,
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error
  };
}
