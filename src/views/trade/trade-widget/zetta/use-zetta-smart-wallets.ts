"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { marketQueryKeys } from "@/lib/market/query-keys";
import type { MatchOutcomeSide } from "@/types/market";

import {
  fetchZettaSmartWallets,
  resolveZettaOutcomeWalletCounts,
  resolveZettaTeamWalletCounts
} from "./fetch-smart-wallets";

type UseZettaSmartWalletsGameParams = {
  variant: "game";
  eventSlug: string;
  outcomeSide: MatchOutcomeSide;
  homeTeamName: string;
  awayTeamName: string;
  enabled?: boolean;
};

type UseZettaSmartWalletsTeamParams = {
  variant: "team";
  eventSlug: string;
  teamName: string;
  enabled?: boolean;
};

export type UseZettaSmartWalletsParams =
  | UseZettaSmartWalletsGameParams
  | UseZettaSmartWalletsTeamParams;

export function useZettaSmartWallets(params: UseZettaSmartWalletsParams) {
  const slug = params.eventSlug.trim();
  const enabled = (params.enabled ?? true) && slug.length > 0;

  const query = useQuery({
    queryKey: marketQueryKeys.zettaSmartWallets(slug),
    queryFn: ({ signal }) => fetchZettaSmartWallets(slug, signal),
    enabled
  });

  const counts = useMemo(() => {
    if (!query.data) {
      return undefined;
    }

    if (params.variant === "team") {
      return resolveZettaTeamWalletCounts(query.data, params.teamName);
    }

    return resolveZettaOutcomeWalletCounts(
      query.data,
      params.outcomeSide,
      params.homeTeamName,
      params.awayTeamName
    );
  }, [params, query.data]);

  return {
    counts,
    payload: query.data,
    isLoading: enabled && query.isLoading,
    isError: enabled && query.isError,
    error: query.error
  };
}
