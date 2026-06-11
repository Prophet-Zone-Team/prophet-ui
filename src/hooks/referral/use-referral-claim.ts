"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { fetchReferralClaim } from "@/lib/referral/api";
import { mapClaimSummaryToProphetReferral } from "@/lib/referral/map-referral";
import { referralQueryKeys } from "@/lib/referral/query-keys";
import {
  patchProphetReferralCache,
  ProphetApiError,
  getProphetReferral,
} from "@/service/prophet";
import { formatNumber } from "@/utils";
import { reportFundingTransaction } from "@/lib/portfolio/user";

export function useReferralClaim() {
  const t = useTranslations("referral");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: fetchReferralClaim,
    onSuccess: (data) => {
      const prevReferral = getProphetReferral();
      void reportFundingTransaction({
        type: "claim",
        txHash: "",
        amount: prevReferral?.claimable_balance_usdc || "0",
      });

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
      toast.success(t("claimSuccess", { amount: amountLabel }));
    },
    onError: (error: unknown) => {
      if (error instanceof ProphetApiError) {
        toast.error(error.message);
        return;
      }

      toast.error(t("claimError"));
    }
  });

  return {
    claim: mutation.mutate,
    isPending: mutation.isPending
  };
}
