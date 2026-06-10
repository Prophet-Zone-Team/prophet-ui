"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { REFERRAL_STALE_TIME_MS } from "@/lib/referral/config";
import { mapProphetReferralToContent } from "@/lib/referral/map-referral";
import { referralQueryKeys } from "@/lib/referral/query-keys";
import {
  getProphetUserReferral,
  isProphetAuthenticated,
  patchProphetReferralCache
} from "@/service/prophet";

async function fetchProphetUserReferral() {
  const data = await getProphetUserReferral();
  patchProphetReferralCache(data);
  return data;
}

export function useProphetReferral() {
  const query = useQuery({
    queryKey: referralQueryKeys.detail,
    queryFn: fetchProphetUserReferral,
    enabled: isProphetAuthenticated(),
    staleTime: REFERRAL_STALE_TIME_MS
  });

  const content = useMemo(
    () => (query.data ? mapProphetReferralToContent(query.data) : undefined),
    [query.data]
  );

  return {
    content,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}
