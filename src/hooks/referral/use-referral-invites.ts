"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchReferralInvites } from "@/lib/referral/api";
import { REFERRAL_STALE_TIME_MS } from "@/lib/referral/config";
import { mapReferralInviteToRow } from "@/lib/referral/map-referral";
import { referralQueryKeys } from "@/lib/referral/query-keys";
import { isProphetAuthenticated } from "@/service/prophet";

export function useReferralInvites(
  page: number,
  pageSize: number,
) {
  const query = useQuery({
    queryKey: referralQueryKeys.invites(page, pageSize),
    queryFn: () =>
      fetchReferralInvites({
        page,
        page_size: pageSize
      }),
    enabled: isProphetAuthenticated(),
    staleTime: REFERRAL_STALE_TIME_MS
  });

  const rows = useMemo(
    () =>
      query.data?.list.map((item) => mapReferralInviteToRow(item, page)) ?? [],
    [query.data?.list, page]
  );

  return {
    rows,
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}
