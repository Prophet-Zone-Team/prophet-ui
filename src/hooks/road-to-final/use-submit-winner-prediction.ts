"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";
import { refreshWinnerActivityQueries } from "@/lib/road-to-final/refresh-winner-activity";
import { ProphetApiError, submitWinnerActivity } from "@/service/prophet";
import { buildWinnerPredictionPayload } from "@/views/road-to-final/lib/winner-prediction";
import type { GroupPlacements, KnockoutWinners } from "@/views/road-to-final/types";

export function useSubmitWinnerPrediction({
  knockoutWinners,
  placements,
  thirdPlaceOption,
}: {
  knockoutWinners: KnockoutWinners;
  placements: GroupPlacements;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
}) {
  const t = useTranslations("roadToFinal");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (twitterUrl: string) =>
      submitWinnerActivity({
        prediction: buildWinnerPredictionPayload({
          knockoutWinners,
          placements,
          thirdPlaceOption,
        }),
        twitter_url: twitterUrl,
      }),
    onSuccess: async () => {
      await refreshWinnerActivityQueries(queryClient);
      toast.success(t("submitPredictionSuccess"));
    },
    onError: (error: unknown) => {
      if (error instanceof ProphetApiError) {
        toast.error(error.message);
        return;
      }

      toast.error(t("submitPredictionError"));
    },
  });

  return {
    submit: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
  };
}
