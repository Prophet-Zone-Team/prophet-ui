"use client";

import { useCallback, useMemo } from "react";

import { useAuth } from "@/context/auth";
import { submitCopyTradeTransferDeposit } from "@/service/copy-trade";
import { pollRelayerTransaction } from "@/lib/trading/deposit-wallet-relayer";
import { fetchJson } from "@/lib/team/client-fetch";
import { signTypedData } from "@/lib/trading/wallet-typed-data-sign";
import type { CopyTradePolymarketDepositPreparePayload } from "@/types/copy-trade-funding";
import { useAuthStore } from "@/store/auth-store";

export const COPY_TRADE_POLYMARKET_DEPOSIT_MIN_USD = 1;

const COPY_TRADE_DEPOSIT_API = "/api/trading/copy-trade-deposit";

export interface UseCopyTradePolymarketDepositOptions {
  copyDepositWalletAddress: string;
  walletReady: boolean;
  isSocialLogin: boolean;
}

export interface UseCopyTradePolymarketDepositResult {
  polymarketBalance: number;
  funderAddress: string | undefined;
  depositWalletReady: boolean;
  canUsePolymarketDeposit: boolean;
  transferFromPolymarket: (amount: string) => Promise<string>;
}

export function useCopyTradePolymarketDeposit(
  options: UseCopyTradePolymarketDepositOptions,
): UseCopyTradePolymarketDepositResult {
  const { copyDepositWalletAddress, walletReady, isSocialLogin } = options;

  const { session, cash } = useAuth();
  const loginMethod = useAuthStore((state) => state.loginMethod);

  const funderAddress = session?.funderAddress;
  const depositWalletReady = session?.depositWalletStatus === "deployed";
  const polymarketBalance = cash?.available ?? 0;

  const canUsePolymarketDeposit = useMemo(
    () =>
      !isSocialLogin &&
      loginMethod !== "email" &&
      loginMethod !== "google" &&
      walletReady &&
      depositWalletReady &&
      Boolean(funderAddress) &&
      Boolean(copyDepositWalletAddress),
    [
      copyDepositWalletAddress,
      depositWalletReady,
      funderAddress,
      isSocialLogin,
      loginMethod,
      walletReady,
    ],
  );

  const transferFromPolymarket = useCallback(
    async (amount: string): Promise<string> => {
      if (!session?.walletAddress) {
        throw new Error("Connect a wallet before transferring funds.");
      }

      if (!copyDepositWalletAddress) {
        throw new Error("Copy trade deposit wallet address is unavailable.");
      }

      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("Enter a valid amount.");
      }

      if (value < COPY_TRADE_POLYMARKET_DEPOSIT_MIN_USD) {
        throw new Error(
          `Minimum deposit is $${COPY_TRADE_POLYMARKET_DEPOSIT_MIN_USD}.`,
        );
      }

      if (value > polymarketBalance) {
        throw new Error("Amount exceeds your Polymarket balance.");
      }

      const search = new URLSearchParams({
        amount,
        recipient: copyDepositWalletAddress,
      });

      const prepared = await fetchJson<CopyTradePolymarketDepositPreparePayload>(
        `${COPY_TRADE_DEPOSIT_API}?${search.toString()}`,
      );

      const signature = await signTypedData(session.walletAddress, prepared.transfer);

      const submitted = await fetchJson<{
        response?: { transactionID?: string; transactionHash?: string; hash?: string };
      }>(COPY_TRADE_DEPOSIT_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature,
          nonce: prepared.transfer.message.nonce,
          deadline: prepared.transfer.message.deadline,
          transfer: prepared.transfer,
        }),
      });

      const transactionId = submitted.response?.transactionID;
      let txHash =
        submitted.response?.transactionHash ??
        submitted.response?.hash ??
        undefined;

      if (transactionId && !txHash) {
        const transaction = await pollRelayerTransaction(transactionId, {
          statusApiPath: COPY_TRADE_DEPOSIT_API,
          errorPrefix: "Copy-trade deposit relayer transaction",
        });
        txHash = transaction.transactionHash;
      }

      if (!txHash) {
        throw new Error("Transfer completed without a transaction hash.");
      }

      await submitCopyTradeTransferDeposit(txHash);

      return txHash;
    },
    [
      copyDepositWalletAddress,
      polymarketBalance,
      session?.walletAddress,
    ],
  );

  return {
    polymarketBalance,
    funderAddress,
    depositWalletReady,
    canUsePolymarketDeposit,
    transferFromPolymarket,
  };
}
