"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthOptional } from "@/context/auth";
import {
  executePendingDepositConvert,
  fetchFunderCollateralBalances,
  getPendingConvertAmountUsd,
  resolvePendingDepositConvertMode,
  type FunderCollateralBalances,
  type PendingDepositConvertMode,
} from "@/lib/trading/deposit-wallet-convert";

const DEFAULT_POLL_INTERVAL_MS = 15_000;

export interface UsePendingFunderUsdcOptions {
  enabled?: boolean;
  pollIntervalMs?: number;
}

export interface UsePendingFunderUsdcResult {
  pendingUsdcBalance: string;
  pendingUsdceBalance: string;
  pendingConvertMode: PendingDepositConvertMode | null;
  pendingDisplayAmount: string;
  hasPendingDeposit: boolean;
  converting: boolean;
  confirmPendingDeposit: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePendingFunderUsdc(
  options: UsePendingFunderUsdcOptions = {},
): UsePendingFunderUsdcResult {
  const { enabled = true, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS } = options;
  const auth = useAuthOptional();
  const session = auth?.session;

  const shouldPoll =
    enabled &&
    Boolean(session?.funderAddress) &&
    session?.depositWalletStatus === "deployed";

  const [collateralBalances, setCollateralBalances] = useState<FunderCollateralBalances | null>(null);
  const [converting, setConverting] = useState(false);
  const pollAbortRef = useRef<AbortController | null>(null);

  const pendingConvertMode = collateralBalances
    ? resolvePendingDepositConvertMode(collateralBalances)
    : null;

  const pendingDisplayAmount =
    collateralBalances && pendingConvertMode
      ? getPendingConvertAmountUsd(collateralBalances, pendingConvertMode)
      : "0";

  const refresh = useCallback(async () => {
    if (!shouldPoll) {
      setCollateralBalances(null);
      return;
    }

    pollAbortRef.current?.abort();
    const controller = new AbortController();
    pollAbortRef.current = controller;

    try {
      const payload = await fetchFunderCollateralBalances();

      if (controller.signal.aborted) {
        return;
      }

      setCollateralBalances(payload);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      console.warn("[usePendingFunderUsdc] balance poll failed", error);
    }
  }, [shouldPoll]);

  useEffect(() => {
    if (!shouldPoll) {
      setCollateralBalances(null);
      return;
    }

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, pollIntervalMs);

    return () => {
      window.clearInterval(timer);
      pollAbortRef.current?.abort();
    };
  }, [pollIntervalMs, refresh, shouldPoll]);

  const hasPendingDeposit = pendingConvertMode !== null;

  const confirmPendingDeposit = useCallback(async () => {
    if (!session?.walletAddress || !collateralBalances || !pendingConvertMode || converting) {
      return;
    }

    setConverting(true);

    try {
      await executePendingDepositConvert({
        walletAddress: session.walletAddress,
        mode: pendingConvertMode,
        amountUsd: getPendingConvertAmountUsd(collateralBalances, pendingConvertMode),
      });

      try {
        await auth?.syncCash();
      } catch (syncError) {
        console.warn("[usePendingFunderUsdc] syncCash after convert failed", syncError);
      }

      await refresh();
    } finally {
      setConverting(false);
    }
  }, [
    auth,
    collateralBalances,
    converting,
    pendingConvertMode,
    refresh,
    session?.walletAddress,
  ]);

  return {
    pendingUsdcBalance: collateralBalances?.usdc.balance ?? "0",
    pendingUsdceBalance: collateralBalances?.usdce.balance ?? "0",
    pendingConvertMode,
    pendingDisplayAmount,
    hasPendingDeposit,
    converting,
    confirmPendingDeposit,
    refresh,
  };
}
