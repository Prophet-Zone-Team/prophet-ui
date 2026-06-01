"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  buildEmptyGameStatisticsRows,
  buildEmptyGameStatisticsGoalEvents,
  mapGameStatisticsGoalEvents,
  mapGameStatisticsRows
} from "@/lib/market/map-game-statistics";
import { marketQueryKeys } from "@/lib/market/query-keys";
import { getScheduleRowVariant } from "@/lib/market/schedule-match";
import { getProphetGameStatistics } from "@/service/prophet";
import { useMatchWithLiveState } from "@/store/match-live-store";
import type { WorldCupMatch } from "@/types/market";

const GAME_STATISTICS_POLL_INTERVAL_MS = 30_000;

export function useGameStatistics(params: {
  match: WorldCupMatch;
  homeTeamName: string;
  awayTeamName: string;
  /** When true, map goal events from API data if available (e.g. live chart active). */
  includeGoalEvents?: boolean;
}) {
  const liveMatch = useMatchWithLiveState(params.match);
  const slug = liveMatch.polymarket?.slug?.trim() ?? "";
  const variant = getScheduleRowVariant(liveMatch.status);
  const enabled = variant !== "upcoming" && slug.length > 0;

  const query = useQuery({
    queryKey: marketQueryKeys.gameStatistics(slug),
    queryFn: () => getProphetGameStatistics({ slug }),
    enabled,
    staleTime:
      variant === "ended" ? Number.POSITIVE_INFINITY : GAME_STATISTICS_POLL_INTERVAL_MS,
    refetchInterval:
      variant === "ongoing" ? GAME_STATISTICS_POLL_INTERVAL_MS : false
  });

  const rows = useMemo(() => {
    if (!enabled) {
      return buildEmptyGameStatisticsRows();
    }

    return mapGameStatisticsRows(
      query.data,
      params.homeTeamName,
      params.awayTeamName
    );
  }, [enabled, params.awayTeamName, params.homeTeamName, query.data]);

  const goalEvents = useMemo(() => {
    const shouldIncludeGoalEvents =
      params.includeGoalEvents ?? variant === "ongoing";

    if (!shouldIncludeGoalEvents) {
      return buildEmptyGameStatisticsGoalEvents();
    }

    return mapGameStatisticsGoalEvents(
      query.data,
      params.homeTeamName,
      params.awayTeamName
    );
  }, [
    params.awayTeamName,
    params.homeTeamName,
    params.includeGoalEvents,
    query.data,
    variant
  ]);

  return {
    rows,
    goalEvents,
    isLoading: enabled && query.isLoading,
    isError: enabled && query.isError,
    error: query.error
  };
}
