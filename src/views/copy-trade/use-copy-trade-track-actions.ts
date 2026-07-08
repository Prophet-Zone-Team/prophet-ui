"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  trackCopyTrader,
  untrackCopyTrader,
} from "@/service/copy-trade";
import type { TraderCatalogEntry } from "@/types/copy-trade-api";

import { useCopyTradeSession } from "./use-copy-trade-session";
import { copyTradeTracksQueryKey } from "./use-copy-trade-tracks";

export function useCopyTradeTrackActions() {
  const t = useTranslations("copyTrade.toast");
  const queryClient = useQueryClient();
  const { userId } = useCopyTradeSession();
  const [toggling, setToggling] = useState(false);

  const toggleTrack = useCallback(
    async (
      trader: TraderCatalogEntry,
      tracked: boolean
    ): Promise<boolean> => {
      if (!userId) {
        toast.error(t("createAccountFirst"));
        return false;
      }

      const wallet = trader.Wallet.trim().toLowerCase();
      setToggling(true);
      const toastId = toast.loading(
        tracked ? t("untrackingTrader") : t("trackingTrader")
      );

      try {
        if (tracked) {
          await untrackCopyTrader(wallet);
        } else {
          await trackCopyTrader(wallet);
        }

        await queryClient.invalidateQueries({
          queryKey: copyTradeTracksQueryKey(userId),
        });
        await queryClient.invalidateQueries({
          queryKey: ["copy-trade", "tracks-latest", userId],
        });
        toast.success(tracked ? t("traderUntracked") : t("traderTracked"), {
          id: toastId,
        });
        return true;
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : tracked
              ? t("unableToUntrack")
              : t("unableToTrack"),
          { id: toastId }
        );
        return false;
      } finally {
        setToggling(false);
      }
    },
    [queryClient, t, userId]
  );

  return { toggling, toggleTrack };
}
