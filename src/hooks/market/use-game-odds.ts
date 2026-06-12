"use client";

import { useQuery } from "@tanstack/react-query";

import { marketQueryKeys } from "@/lib/market/query-keys";
import { getScheduleRowVariant } from "@/lib/market/schedule-match";
import { getProphetGameOdds } from "@/service/prophet";
import { useMatchWithLiveState } from "@/store/match-live-store";
import type { WorldCupMatch } from "@/types/market";

const GAME_ODDS_POLL_INTERVAL_MS = 30_000;
const GAME_ODDS_IDLE_STALE_TIME_MS = 5 * 60_000;

export function useGameOdds(params: {
  match: WorldCupMatch;
  enabled?: boolean;
}) {
  const liveMatch = useMatchWithLiveState(params.match);
  const slug = liveMatch.polymarket?.slug?.trim() ?? "";
  const variant = getScheduleRowVariant(liveMatch.status);
  const enabled = (params.enabled ?? true) && slug.length > 0;
  const isOngoing = variant === "ongoing";

  const query = useQuery({
    queryKey: marketQueryKeys.gameOdds(slug),
    queryFn: ({ signal }) => getProphetGameOdds({ slug, signal }),
    enabled,
    staleTime: isOngoing
      ? GAME_ODDS_POLL_INTERVAL_MS
      : variant === "ended"
        ? Number.POSITIVE_INFINITY
        : GAME_ODDS_IDLE_STALE_TIME_MS,
    refetchInterval: isOngoing ? GAME_ODDS_POLL_INTERVAL_MS : false
  });

  return {
    odds: query.data,
    slug,
    variant,
    isLoading: enabled && query.isLoading,
    isError: enabled && query.isError,
    error: query.error
  };
}
