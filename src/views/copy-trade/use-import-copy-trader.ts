"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { validateImportWalletAddress } from "@/lib/copy-trade/import-wallet";
import { importCopyTrader } from "@/service/copy-trade";

import { COPY_TRADE_TRADERS_QUERY_KEY } from "./use-copy-trade-rank";

export function useImportCopyTrader() {
  const t = useTranslations("copyTrade.importWallet");
  const queryClient = useQueryClient();
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
        await importCopyTrader(validation.wallet);
        await queryClient.invalidateQueries({
          queryKey: COPY_TRADE_TRADERS_QUERY_KEY,
        });
        toast.success(t("success"), { id: toastId });
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
    [queryClient, t]
  );

  return { importing, importWallet };
}
