"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  isCopyWalletReady,
  submitCopyTradeWithdrawalSigned,
} from "@/lib/copy-trade/auth";
import { getCopyWithdrawalBlockReason } from "@/lib/copy-trade/withdrawal-readiness";
import { newCopyWithdrawalClientRequestId } from "@/lib/copy-trade/withdrawal-id";
import {
  getCopyTradeBalances,
  getCopyTradeWithdrawalReadiness,
} from "@/service/copy-trade/endpoints";
import { useCopyTradeFundingStore } from "@/store/copy-trade-funding-store";
import { useCopyTradeStoredSession } from "@/store/copy-trade-store";
import type { CopyTradeBalance } from "@/types/copy-trade-api";
import type {
  CopyWithdrawal,
  CopyWithdrawalAssetInfo,
  CopyWithdrawalReadiness,
} from "@/types/copy-trade-funding";

const EVM_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

export interface SubmitCopyWithdrawArgs {
  amount: string;
  recipient: string;
  asset: string;
}

export interface UseCopyTradeWithdrawResult {
  userId: number | undefined;
  walletReady: boolean;
  loading: boolean;
  submitting: boolean;
  readiness: CopyWithdrawalReadiness | null;
  availableAssets: CopyWithdrawalAssetInfo[];
  allAssets: CopyWithdrawalAssetInfo[];
  maxAmount: number;
  blockReason: string;
  defaultRecipient: string;
  isValidRecipient: (recipient: string) => boolean;
  refresh: () => Promise<void>;
  submitWithdraw: (args: SubmitCopyWithdrawArgs) => Promise<CopyWithdrawal>;
}

export function useCopyTradeWithdraw(open: boolean): UseCopyTradeWithdrawResult {
  const copyTradeSession = useCopyTradeStoredSession();
  const userId = copyTradeSession?.user?.ID;
  const copyWallet = copyTradeSession?.copyWallet ?? null;
  const walletAddress = copyTradeSession?.walletAddress ?? "";
  const walletReady = isCopyWalletReady(copyWallet);
  const defaultRecipient = copyTradeSession?.user?.WebWalletAddress ?? "";

  const withdrawalAssets = useCopyTradeFundingStore(
    (state) => state.withdrawalAssets,
  );
  const loadWithdrawalAssets = useCopyTradeFundingStore(
    (state) => state.loadWithdrawalAssets,
  );
  const assetsLoading = useCopyTradeFundingStore(
    (state) => state.withdrawalAssetsLoading,
  );

  const [readiness, setReadiness] = useState<CopyWithdrawalReadiness | null>(
    null,
  );
  const [balance, setBalance] = useState<CopyTradeBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allAssets = withdrawalAssets;

  const availableAssets = useMemo(
    () =>
      withdrawalAssets.filter(
        (asset) => asset.enabled && asset.status === "supported",
      ),
    [withdrawalAssets],
  );

  const maxAmount = balance?.Available ?? readiness?.available_pusd ?? 0;

  const blockReason = useMemo(
    () => getCopyWithdrawalBlockReason({ walletReady, readiness }),
    [readiness, walletReady],
  );

  const refresh = useCallback(async () => {
    if (!userId) {
      return;
    }

    setLoading(true);
    try {
      const [readinessResult, balanceResult] = await Promise.all([
        getCopyTradeWithdrawalReadiness(userId).catch(() => null),
        getCopyTradeBalances(userId).catch(() => null),
      ]);
      setReadiness(readinessResult);
      setBalance(balanceResult);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const isValidRecipient = useCallback(
    (recipient: string) => EVM_ADDRESS_PATTERN.test(recipient.trim()),
    [],
  );

  const submitWithdraw = useCallback(
    async ({
      amount,
      recipient,
      asset,
    }: SubmitCopyWithdrawArgs): Promise<CopyWithdrawal> => {
      if (!userId) {
        throw new Error("Copy trade session is not ready.");
      }
      if (!walletAddress) {
        throw new Error("Connect your wallet to sign the withdrawal.");
      }

      const trimmedRecipient = recipient.trim();
      if (!EVM_ADDRESS_PATTERN.test(trimmedRecipient)) {
        throw new Error("Enter a valid recipient address.");
      }

      const amountPusd = Number(amount);
      if (!Number.isFinite(amountPusd) || amountPusd <= 0) {
        throw new Error("Enter a valid withdrawal amount.");
      }

      setSubmitting(true);
      try {
        const withdrawal = await submitCopyTradeWithdrawalSigned(
          walletAddress,
          userId,
          {
            client_request_id: newCopyWithdrawalClientRequestId(userId),
            amount_pusd: amountPusd,
            recipient_address: trimmedRecipient,
            asset: asset || undefined,
          },
        );

        void refresh();

        return withdrawal;
      } finally {
        setSubmitting(false);
      }
    },
    [refresh, userId, walletAddress],
  );

  useEffect(() => {
    if (!open || !userId) {
      return;
    }

    void loadWithdrawalAssets();
    void refresh();
  }, [loadWithdrawalAssets, open, refresh, userId]);

  return {
    userId,
    walletReady,
    loading: loading || assetsLoading,
    submitting,
    readiness,
    availableAssets,
    allAssets,
    maxAmount,
    blockReason,
    defaultRecipient,
    isValidRecipient,
    refresh,
    submitWithdraw,
  };
}
