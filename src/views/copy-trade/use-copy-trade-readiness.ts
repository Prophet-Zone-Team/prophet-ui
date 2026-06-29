"use client";

import { useMemo } from "react";

import { useAuthHydrated } from "@/store/use-auth-hydrated";
import { useAuthStore } from "@/store/auth-store";
import { useCopyTradeStore } from "@/store/copy-trade-store";
import { useCopyTradeHydrated } from "@/store/use-copy-trade-hydrated";
import type { CopyWallet } from "@/types/copy-trade-api";

import { useCopyTradeProfileStats } from "./use-copy-trade-profile-stats";
import { useCopyTradeSession } from "./use-copy-trade-session";

export const COPY_ZERO_BALANCE_WARNING =
  "Copy wallet balance is $0. Deposit funds before live copy orders can execute.";

export interface CopyTradeReadiness {
  hydrated: boolean;
  canOpenCopy: boolean;
  canSubmitCopy: boolean;
  copyWallet: CopyWallet | null;
  availableBalance: number | null;
  isLoadingBalance: boolean;
  disabledReason: string | null;
  balanceWarning: string | null;
}

export function useCopyTradeReadiness(): CopyTradeReadiness {
  const authHydrated = useAuthHydrated();
  const copyTradeHydrated = useCopyTradeHydrated();
  const prophetWalletAddress = useAuthStore(
    (state) => state.session?.walletAddress
  );
  const copyWallet = useCopyTradeStore((state) => state.copyWallet);
  const { userId } = useCopyTradeSession();

  const hydrated = authHydrated && copyTradeHydrated;

  const { balance, isLoadingBalance } = useCopyTradeProfileStats({
    enabled: Boolean(copyWallet)
  });

  return useMemo(() => {
    if (!hydrated) {
      return {
        hydrated: false,
        canOpenCopy: false,
        canSubmitCopy: false,
        copyWallet: copyWallet ?? null,
        availableBalance: balance,
        isLoadingBalance,
        disabledReason: null,
        balanceWarning: null
      };
    }

    let disabledReason: string | null = null;

    if (!prophetWalletAddress) {
      disabledReason = "Connect wallet to copy";
    } else if (!userId) {
      disabledReason = "Create copy-trade account first";
    } else if (!copyWallet) {
      disabledReason = "Create copy-trade wallet first";
    }

    const canOpenCopy = disabledReason === null;
    const balanceWarning =
      canOpenCopy && balance !== null && balance <= 0
        ? COPY_ZERO_BALANCE_WARNING
        : null;
    const canSubmitCopy =
      canOpenCopy &&
      !isLoadingBalance &&
      balance !== null &&
      balance > 0;

    return {
      hydrated: true,
      canOpenCopy,
      canSubmitCopy,
      copyWallet: copyWallet ?? null,
      availableBalance: balance,
      isLoadingBalance,
      disabledReason,
      balanceWarning
    };
  }, [
    balance,
    copyWallet,
    hydrated,
    isLoadingBalance,
    prophetWalletAddress,
    userId
  ]);
}
