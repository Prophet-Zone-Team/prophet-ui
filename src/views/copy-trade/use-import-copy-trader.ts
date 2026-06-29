"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { validateImportWalletAddress } from "@/lib/copy-trade/import-wallet";
import { importCopyTrader } from "@/service/copy-trade";

import { copyTradeRankQueryKey } from "./use-copy-trade-rank";

export function useImportCopyTrader() {
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
      const toastId = toast.loading("Importing wallet…");

      try {
        await importCopyTrader(validation.wallet);
        await queryClient.invalidateQueries({ queryKey: copyTradeRankQueryKey });
        toast.success("Wallet imported.", { id: toastId });
        return true;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to import wallet.",
          { id: toastId }
        );
        return false;
      } finally {
        setImporting(false);
      }
    },
    [queryClient]
  );

  return { importing, importWallet };
}
