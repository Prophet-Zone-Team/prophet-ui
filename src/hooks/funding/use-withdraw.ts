"use client";

import type { OneClickStatus, QuoteResponse } from "@stableflow/core";
import { useCallback, useRef, useState } from "react";
import { parseUnits } from "viem";

import { useAuth } from "@/context/auth";
import {
  isStableflowWithdrawLocalPolygonUsdc,
  type StableflowWithdrawToken,
} from "@/lib/funding/stableflow-withdraw";
import { resolveBridgeWithdrawDepositAddress } from "@/lib/market/deposit-wallet-batch";
import { pollRelayerTransaction } from "@/lib/trading/deposit-wallet-relayer";
import { isTerminalBridgeStatus, pollBridgeAddress } from "@/lib/trading/bridge-status";
import { fetchJson } from "@/lib/team/client-fetch";
import {
  isStableflowSuccessStatus,
  isStableflowTerminalFailureStatus,
  pollStableflowExecution,
} from "@/lib/trading/stableflow-bridge-status";
import {
  ensureWithdrawConvertPolygonChain,
  executeWithdrawConvertPhase,
} from "@/lib/trading/withdraw-wallet-convert";
import { signTypedData } from "@/lib/trading/wallet-typed-data-sign";
import type {
  BridgeAggregateStatus,
  BridgeFlowStatus,
  BridgeStatusResponse,
  BridgeTransactionRecord,
  BridgeWithdrawParams,
  WithdrawOperationPhase,
  WithdrawPreparePayload,
} from "@/types/funding";

export interface StableflowWithdrawParams {
  amountUsd: number;
  destinationToken: StableflowWithdrawToken;
  recipient: string;
}

export interface UseWithdrawResult {
  status: BridgeFlowStatus;
  bridgeStatus: BridgeAggregateStatus;
  transactions: BridgeTransactionRecord[];
  error: string | undefined;
  operationPhase: WithdrawOperationPhase;
  operationDetail: string | undefined;
  prepareWithdraw: (params: BridgeWithdrawParams & { amountUsd: number }) => Promise<WithdrawPreparePayload>;
  signAndSubmitWithdraw: (payload: WithdrawPreparePayload) => Promise<{ statusAddress: string; txHash?: string }>;
  executeBridgeWithdraw: (params: BridgeWithdrawParams & { amountUsd: number }) => Promise<{ txHash?: string }>;
  fetchStableflowWithdrawQuote: (
    params: StableflowWithdrawParams & { dry?: boolean },
  ) => Promise<QuoteResponse>;
  executeStableflowWithdraw: (params: StableflowWithdrawParams) => Promise<{ txHash: string }>;
  startStatusPoll: (statusAddress: string) => Promise<BridgeAggregateStatus>;
  stopStatusPoll: () => void;
  /** @deprecated Use executeBridgeWithdraw */
  executeWithdraw: (params: BridgeWithdrawParams & { amountUsd: number }) => Promise<{ txHash?: string }>;
}

export function useWithdraw(): UseWithdrawResult {
  const { session, syncCash } = useAuth();
  const [status, setStatus] = useState<BridgeFlowStatus>("idle");
  const [bridgeStatus, setBridgeStatus] = useState<BridgeAggregateStatus>("pending");
  const [transactions, setTransactions] = useState<BridgeTransactionRecord[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [operationPhase, setOperationPhase] = useState<WithdrawOperationPhase>("idle");
  const [operationDetail, setOperationDetail] = useState<string | undefined>();
  const pollAbortRef = useRef<AbortController | undefined>(undefined);
  const stableflowPollAbortRef = useRef<AbortController | undefined>(undefined);

  const fetchWithdrawStatus = useCallback(async (statusAddress: string) => {
    const payload = await fetchJson<{ status: BridgeStatusResponse }>(
      `/api/trading/withdraw?statusAddress=${encodeURIComponent(statusAddress)}`,
    );

    return payload.status;
  }, []);

  const stopStatusPoll = useCallback(() => {
    pollAbortRef.current?.abort();
    pollAbortRef.current = undefined;
    stableflowPollAbortRef.current?.abort();
    stableflowPollAbortRef.current = undefined;
  }, []);

  const finalizeIfCompleted = useCallback(
    async (aggregateStatus: BridgeAggregateStatus) => {
      if (aggregateStatus !== "completed") {
        return aggregateStatus;
      }

      setStatus("syncing");
      setOperationPhase("syncing");

      try {
        await syncCash();
        setStatus("success");
        setOperationPhase("success");
      } catch (syncError) {
        setStatus("error");
        setOperationPhase("error");
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
      setOperationPhase("polling_bridge");
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
          setOperationPhase("error");
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
        setOperationPhase("error");
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

  const prepareWithdraw = useCallback(async ({
    toChainId,
    toTokenAddress,
    recipientAddr,
    amountUsd,
  }: BridgeWithdrawParams & { amountUsd: number }) => {
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
      setOperationPhase("error");
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
      const submitted = await fetchJson<{
        response?: { transactionID?: string; transactionHash?: string; hash?: string };
      }>("/api/trading/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature,
          nonce: payload.transfer.message.nonce,
          deadline: payload.transfer.message.deadline,
          transfer: payload.transfer,
        }),
      });

      const statusAddress = resolveBridgeWithdrawDepositAddress(payload.withdrawal.address);
      const transactionId = submitted.response?.transactionID;
      let txHash =
        submitted.response?.transactionHash ??
        submitted.response?.hash ??
        undefined;

      if (transactionId && !txHash) {
        const transaction = await pollRelayerTransaction(transactionId, {
          statusApiPath: "/api/trading/withdraw",
          errorPrefix: "Withdraw relayer transaction"
        });
        txHash = transaction.transactionHash;
      }

      return { statusAddress, txHash };
    },
    [session],
  );

  const executeBridgeWithdraw = useCallback(
    async (params: BridgeWithdrawParams & { amountUsd: number }) => {
      try {
        setOperationPhase("polling_bridge");
        const prepared = await prepareWithdraw(params);
        const { statusAddress, txHash: relayerTxHash } =
          await signAndSubmitWithdraw(prepared);
        const aggregateStatus = await startStatusPoll(statusAddress);

        if (!isTerminalBridgeStatus(aggregateStatus)) {
          throw new Error("Withdrawal status polling ended before completion.");
        }

        if (aggregateStatus !== "completed") {
          return {};
        }

        if (relayerTxHash) {
          return { txHash: relayerTxHash };
        }

        const latestStatus = await fetchWithdrawStatus(statusAddress);
        return {
          txHash: resolveReportTxHash(
            (latestStatus.transactions ?? []) as BridgeTransactionRecord[]
          )
        };
      } catch (withdrawError) {
        if (status !== "syncing" && operationPhase !== "syncing") {
          setStatus("error");
          setOperationPhase("error");
        }

        setError(withdrawError instanceof Error ? withdrawError.message : String(withdrawError));
        throw withdrawError;
      }
    },
    [
      fetchWithdrawStatus,
      operationPhase,
      prepareWithdraw,
      signAndSubmitWithdraw,
      startStatusPoll,
      status
    ],
  );

  const fetchStableflowWithdrawQuote = useCallback(
    async ({ amountUsd, destinationToken, recipient, dry = true }: StableflowWithdrawParams & { dry?: boolean }) => {
      if (!session?.funderAddress) {
        throw new Error("Trading session is missing a deposit wallet.");
      }

      const amountBaseUnits = parseUnits(String(amountUsd), 6).toString();

      const { quote } = await fetchJson<{ quote: QuoteResponse }>("/api/trading/stableflow/withdraw-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destinationAssetId: destinationToken.assetId,
          amountBaseUnits,
          recipient,
          dry,
          destinationBlockchain: destinationToken.blockchain,
        }),
      });

      return quote;
    },
    [session],
  );

  const pollStableflowWithdraw = useCallback(
    async (depositAddress: string, depositMemo: string | undefined) => {
      stableflowPollAbortRef.current?.abort();
      const controller = new AbortController();
      stableflowPollAbortRef.current = controller;

      const fetchStatus = async (address: string, memo?: string) => {
        const search = new URLSearchParams({ depositAddress: address });

        if (memo) {
          search.set("depositMemo", memo);
        }

        const payload = await fetchJson<{ status: { status: OneClickStatus } }>(
          `/api/trading/stableflow/status?${search.toString()}`,
          { signal: controller.signal },
        );

        return payload.status;
      };

      const finalStatus = await pollStableflowExecution({
        fetchStatus,
        depositAddress,
        depositMemo,
        signal: controller.signal,
        onUpdate: (stableflowStatus) => {
          setOperationDetail(`Stableflow status: ${stableflowStatus}`);
        },
      });

      if (isStableflowTerminalFailureStatus(finalStatus)) {
        throw new Error(`Stableflow withdrawal did not complete successfully (${finalStatus}).`);
      }

      if (!isStableflowSuccessStatus(finalStatus)) {
        throw new Error(`Stableflow withdrawal ended in unexpected status (${finalStatus}).`);
      }

      return finalStatus;
    },
    [],
  );

  const executeStableflowWithdraw = useCallback(
    async ({ amountUsd, destinationToken, recipient }: StableflowWithdrawParams) => {
      if (!session?.walletAddress || !session.funderAddress) {
        throw new Error("Connect a wallet before submitting a withdrawal.");
      }

      const amountUsdString = String(amountUsd);
      const isLocal = isStableflowWithdrawLocalPolygonUsdc(destinationToken);

      setError(undefined);
      setOperationPhase("quoting");
      setOperationDetail(undefined);

      let depositAddress: string | undefined;
      let depositMemo: string | undefined;

      try {
        await ensureWithdrawConvertPolygonChain(session.walletAddress);

        if (!isLocal) {
          setOperationDetail("Requesting Stableflow quote…");
          const quote = await fetchStableflowWithdrawQuote({
            amountUsd,
            destinationToken,
            recipient,
            dry: false,
          });
          depositAddress = quote.quote.depositAddress;
          depositMemo = quote.quote.depositMemo;

          if (!depositAddress) {
            throw new Error("Stableflow quote did not return a deposit address.");
          }
        }

        const swapRecipient = isLocal ? recipient : depositAddress!;

        setOperationPhase("unwrapping");
        setOperationDetail("Unwrapping pUSD to USDC.e…");
        await executeWithdrawConvertPhase({
          walletAddress: session.walletAddress,
          phase: "pusd-to-usdce",
          amountUsd: amountUsdString,
          onStatus: setOperationDetail,
        });

        setOperationPhase("swapping");
        setOperationDetail("Swapping USDC.e to USDC…");
        const { txHash } = await executeWithdrawConvertPhase({
          walletAddress: session.walletAddress,
          phase: "usdce-to-usdc",
          amountUsd: amountUsdString,
          swapRecipient,
          onStatus: setOperationDetail,
        });

        if (!isLocal && depositAddress) {
          setOperationPhase("submitting_deposit_tx");
          setOperationDetail("Registering deposit with Stableflow…");
          await fetchJson("/api/trading/stableflow/submit-tx", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              txHash,
              depositAddress,
            }),
          });

          setOperationPhase("polling_stableflow");
          setOperationDetail("Waiting for cross-chain transfer…");
          await pollStableflowWithdraw(depositAddress, depositMemo);
        }

        setStatus("syncing");
        setOperationPhase("syncing");
        setOperationDetail("Updating balance…");
        await syncCash();
        setStatus("success");
        setOperationPhase("success");
        setOperationDetail(undefined);
        return { txHash };
      } catch (withdrawError) {
        setStatus("error");
        setOperationPhase("error");
        setError(withdrawError instanceof Error ? withdrawError.message : String(withdrawError));
        throw withdrawError;
      }
    },
    [fetchStableflowWithdrawQuote, pollStableflowWithdraw, session, syncCash],
  );

  return {
    status,
    bridgeStatus,
    transactions,
    error,
    operationPhase,
    operationDetail,
    prepareWithdraw,
    signAndSubmitWithdraw,
    executeBridgeWithdraw,
    fetchStableflowWithdrawQuote,
    executeStableflowWithdraw,
    startStatusPoll,
    stopStatusPoll,
    executeWithdraw: executeBridgeWithdraw,
  };
}

function resolveReportTxHash(
  transactions: BridgeTransactionRecord[]
): string | undefined {
  const completed = transactions.find(
    (transaction) => transaction.status === "COMPLETED" && transaction.txHash
  );

  if (completed?.txHash) {
    return completed.txHash;
  }

  return transactions.find((transaction) => transaction.txHash)?.txHash;
}
