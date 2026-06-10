"use client";

import { useQuery } from "@tanstack/react-query";

import { marketQueryKeys } from "@/lib/market/query-keys";
import { getProphetGameOdds } from "@/service/prophet";

const GAME_ODDS_STALE_TIME_MS = 5 * 60_000;

export function useGameOdds(params: { slug: string; enabled?: boolean }) {
  const slug = params.slug.trim();
  const enabled = (params.enabled ?? true) && slug.length > 0;

  const query = useQuery({
    queryKey: marketQueryKeys.gameOdds(slug),
    queryFn: ({ signal }) => getProphetGameOdds({ slug, signal }),
    enabled,
    staleTime: GAME_ODDS_STALE_TIME_MS,
    refetchInterval: false
  });

  return {
    odds: query.data,
    slug,
    isLoading: enabled && query.isLoading,
    isError: enabled && query.isError,
    error: query.error
  };
}
