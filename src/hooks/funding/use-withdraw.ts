"use client";

import { useCallback, useRef, useState } from "react";

import { signTypedData } from "@/components/trading/quick-bid-account-setup";
import { useAuth } from "@/context/auth";
import {
  isTerminalBridgeStatus,
  pollBridgeAddress,
} from "@/lib/trading/bridge-status";
import { fetchJson } from "@/lib/team/client-fetch";
import type {
  BridgeAggregateStatus,
  BridgeFlowStatus,
  BridgeStatusResponse,
  BridgeTransactionRecord,
  BridgeWithdrawParams,
  WithdrawPreparePayload,
} from "@/types/funding";

export interface UseWithdrawResult {
  status: BridgeFlowStatus;
  bridgeStatus: BridgeAggregateStatus;
  transactions: BridgeTransactionRecord[];
  error: string | undefined;
  supportedAssets: unknown;
  loadSupportedAssets: () => Promise<unknown>;
  prepareWithdraw: (params: BridgeWithdrawParams & { amountUsd: number }) => Promise<WithdrawPreparePayload>;
  signAndSubmitWithdraw: (payload: WithdrawPreparePayload) => Promise<{ statusAddress: string }>;
  executeWithdraw: (params: BridgeWithdrawParams & { amountUsd: number }) => Promise<BridgeAggregateStatus>;
  startStatusPoll: (statusAddress: string) => Promise<BridgeAggregateStatus>;
  stopStatusPoll: () => void;
}

export function useWithdraw(): UseWithdrawResult {
  const { session, syncCash } = useAuth();
  const [status, setStatus] = useState<BridgeFlowStatus>("idle");
  const [bridgeStatus, setBridgeStatus] = useState<BridgeAggregateStatus>("pending");
  const [transactions, setTransactions] = useState<BridgeTransactionRecord[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [supportedAssets, setSupportedAssets] = useState<unknown>();
  const pollAbortRef = useRef<AbortController | undefined>(undefined);

  const fetchWithdrawStatus = useCallback(async (statusAddress: string) => {
    const payload = await fetchJson<{ status: BridgeStatusResponse }>(
      `/api/trading/withdraw?statusAddress=${encodeURIComponent(statusAddress)}`,
    );

    return payload.status;
  }, []);

  const stopStatusPoll = useCallback(() => {
    pollAbortRef.current?.abort();
    pollAbortRef.current = undefined;
  }, []);

  const finalizeIfCompleted = useCallback(
    async (aggregateStatus: BridgeAggregateStatus) => {
      if (aggregateStatus !== "completed") {
        return aggregateStatus;
      }

      setStatus("syncing");

      try {
        await syncCash();
        setStatus("success");
      } catch (syncError) {
        setStatus("error");
        setError(syncError instanceof Error ? syncError.message : String(syncError));
      }

      return aggregateStatus;
    },
    [syncCash],
  );

  const startStatusPoll = useCallback(
    async (statusAddress: string) => {
      stopStatusPoll();
      const controller = new AbortController();
      pollAbortRef.current = controller;

      setStatus("polling");
      setError(undefined);
      setBridgeStatus("pending");

      try {
        const result = await pollBridgeAddress({
          fetchStatus: fetchWithdrawStatus,
          statusAddress,
          signal: controller.signal,
          onUpdate: ({ status: nextStatus, response }) => {
            setBridgeStatus(nextStatus);
            setTransactions((response.transactions ?? []) as BridgeTransactionRecord[]);
          },
        });

        setBridgeStatus(result.status);
        setTransactions((result.response.transactions ?? []) as BridgeTransactionRecord[]);

        if (result.status === "failed") {
          setStatus("error");
          setError("Bridge withdrawal did not complete successfully.");
          return result.status;
        }

        await finalizeIfCompleted(result.status);
        return result.status;
      } catch (pollError) {
        if (controller.signal.aborted) {
          return bridgeStatus;
        }

        setStatus("error");
        setError(pollError instanceof Error ? pollError.message : String(pollError));
        throw pollError;
      } finally {
        if (pollAbortRef.current === controller) {
          pollAbortRef.current = undefined;
        }
      }
    },
    [bridgeStatus, fetchWithdrawStatus, finalizeIfCompleted, stopStatusPoll],
  );

  const loadSupportedAssets = useCallback(async () => {
    const payload = await fetchJson<{ assets: unknown }>("/api/trading/bridge/supported-assets");
    setSupportedAssets(payload.assets);
    return payload.assets;
  }, []);

  const prepareWithdraw = useCallback(async ({ toChainId, toTokenAddress, recipientAddr, amountUsd }: BridgeWithdrawParams & { amountUsd: number }) => {
    setStatus("preparing");
    setError(undefined);

    const search = new URLSearchParams({
      toChainId,
      toTokenAddress,
      recipientAddr,
      amount: String(amountUsd),
    });

    try {
      const payload = await fetchJson<WithdrawPreparePayload>(`/api/trading/withdraw?${search.toString()}`);
      setStatus("idle");
      return payload;
    } catch (prepareError) {
      setStatus("error");
      setError(prepareError instanceof Error ? prepareError.message : String(prepareError));
      throw prepareError;
    }
  }, []);

  const signAndSubmitWithdraw = useCallback(
    async (payload: WithdrawPreparePayload) => {
      if (!session?.walletAddress) {
        throw new Error("Connect a wallet before submitting a withdrawal.");
      }

      setStatus("awaiting_wallet");
      setError(undefined);

      const signature = await signTypedData(session.walletAddress, payload.transfer);
      await fetchJson<{ response?: unknown }>("/api/trading/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature,
          nonce: payload.transfer.nonce,
          deadline: payload.transfer.deadline,
          transfer: payload.transfer,
        }),
      });

      const statusAddress = payload.withdrawal.address.evm;

      if (!statusAddress) {
        throw new Error("Bridge did not return an EVM withdrawal address.");
      }

      return { statusAddress };
    },
    [session?.walletAddress],
  );

  const executeWithdraw = useCallback(
    async (params: BridgeWithdrawParams & { amountUsd: number }) => {
      try {
        const prepared = await prepareWithdraw(params);
        const { statusAddress } = await signAndSubmitWithdraw(prepared);
        const aggregateStatus = await startStatusPoll(statusAddress);

        if (!isTerminalBridgeStatus(aggregateStatus)) {
          throw new Error("Withdrawal status polling ended before completion.");
        }

        return aggregateStatus;
      } catch (withdrawError) {
        if (status !== "syncing") {
          setStatus("error");
        }

        setError(withdrawError instanceof Error ? withdrawError.message : String(withdrawError));
        throw withdrawError;
      }
    },
    [prepareWithdraw, signAndSubmitWithdraw, startStatusPoll, status],
  );

  return {
    status,
    bridgeStatus,
    transactions,
    error,
    supportedAssets,
    loadSupportedAssets,
    prepareWithdraw,
    signAndSubmitWithdraw,
    executeWithdraw,
    startStatusPoll,
    stopStatusPoll,
  };
}
