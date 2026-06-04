"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { fetchReferralClaim } from "@/lib/referral/api";
import { mapClaimSummaryToProphetReferral } from "@/lib/referral/map-referral";
import { referralQueryKeys } from "@/lib/referral/query-keys";
import {
  patchProphetReferralCache,
  ProphetApiError
} from "@/service/prophet";
import { formatNumber } from "@/utils";

export function useReferralClaim() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: fetchReferralClaim,
    onSuccess: (data) => {
      patchProphetReferralCache({
        claimable_balance_usdc: data.summary.claimable_balance_usdc,
        claimed_balance_usdc: data.summary.claimed_balance_usdc
      });
      queryClient.setQueryData(
        referralQueryKeys.detail,
        mapClaimSummaryToProphetReferral(data.summary)
      );
      void queryClient.invalidateQueries({
        queryKey: referralQueryKeys.invitesRoot
      });

      const amountLabel = formatNumber(data.amount_usdc, 2, true) as string;
      toast.success(`Claimed ${amountLabel} USDC`);
    },
    onError: (error: unknown) => {
      if (error instanceof ProphetApiError) {
        toast.error(error.message);
        return;
      }

      toast.error("Unable to claim referral rewards.");
    }
  });

  return {
    claim: mutation.mutate,
    isPending: mutation.isPending
  };
}
