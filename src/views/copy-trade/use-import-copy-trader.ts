"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  isCatalogWalletAlreadyExistsError,
  validateImportWalletAddress,
} from "@/lib/copy-trade/import-wallet";
import { findCatalogTraderByWallet } from "@/lib/copy-trade/trader-catalog-stats";
import { importCopyTrader, trackCopyTrader } from "@/service/copy-trade";
import type { TraderCatalogEntry } from "@/types/copy-trade-api";

import { useCopyTradeSession } from "./use-copy-trade-session";
import {
  COPY_TRADE_TRADERS_QUERY_KEY,
  fetchCopyTradeTraders,
} from "./use-copy-trade-rank";
import { copyTradeTracksQueryKey } from "./use-copy-trade-tracks";

export function useImportCopyTrader() {
  const t = useTranslations("copyTrade.importWallet");
  const queryClient = useQueryClient();
  const { userId } = useCopyTradeSession();
  const [importing, setImporting] = useState(false);

  const importWallet = useCallback(
    async (rawAddress: string): Promise<boolean> => {
      const validation = validateImportWalletAddress(rawAddress);

      if (!validation.ok) {
        toast.error(validation.error);
        return false;
      }

      setImporting(true);
      const toastId = toast.loading(t("importing"));

      try {
        const traders =
          queryClient.getQueryData<TraderCatalogEntry[]>(
            COPY_TRADE_TRADERS_QUERY_KEY
          ) ??
          (await queryClient.fetchQuery({
            queryKey: COPY_TRADE_TRADERS_QUERY_KEY,
            queryFn: fetchCopyTradeTraders,
          }));

        const existsInRank = Boolean(
          findCatalogTraderByWallet(traders, validation.wallet)
        );

        let shouldAutoTrack = existsInRank;

        try {
          await importCopyTrader(validation.wallet);
        } catch (error) {
          if (isCatalogWalletAlreadyExistsError(error)) {
            shouldAutoTrack = true;
          } else {
            throw error;
          }
        }

        await queryClient.invalidateQueries({
          queryKey: COPY_TRADE_TRADERS_QUERY_KEY,
        });

        let tracked = false;
        if (shouldAutoTrack && userId) {
          const tracks = queryClient.getQueryData<TraderCatalogEntry[]>(
            copyTradeTracksQueryKey(userId)
          );
          const alreadyTracked = tracks?.some(
            (trader) =>
              trader.Wallet.toLowerCase() === validation.wallet.toLowerCase()
          );

          if (!alreadyTracked) {
            try {
              await trackCopyTrader(validation.wallet);
              await queryClient.invalidateQueries({
                queryKey: copyTradeTracksQueryKey(userId),
              });
              await queryClient.invalidateQueries({
                queryKey: ["copy-trade", "tracks-latest", userId],
              });
              tracked = true;
            } catch (trackError) {
              console.warn("Auto-track after wallet import failed:", trackError);
            }
          }
        }

        toast.success(tracked ? t("successAndTracked") : t("success"), {
          id: toastId,
        });
        return true;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("unableToImport"),
          { id: toastId }
        );
        return false;
      } finally {
        setImporting(false);
      }
    },
    [queryClient, t, userId]
  );

  return { importing, importWallet };
}
