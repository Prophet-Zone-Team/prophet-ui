"use client";

import type { OneClickStatus, QuoteResponse } from "@stableflow/core";
import { useCallback, useRef, useState } from "react";
import { parseUnits } from "viem";

import { useAuth } from "@/context/auth";
import type { FundingAsset } from "@/config/funding";
import { FundingNetworkType } from "@/config/funding/networks";
import { useSupportedAssets } from "@/hooks/funding/use-supported-assets";
import {
  getStableflowRefundAddress,
  isPolygonNativeUsdcToken,
  resolveFundingWalletAddress,
  requiresFundingWalletConnection,
  type StableflowDepositToken,
} from "@/lib/funding/stableflow";
import { getNearAccountSnapshot } from "@/lib/wallet/near/near-account-store";
import { transferNearFtToken } from "@/lib/wallet/near/near-transfer";
import { isTerminalBridgeStatus, pollBridgeAddress } from "@/lib/trading/bridge-status";
import {
  fetchFunderCollateralBalances,
  resolvePendingDepositConvertMode,
  type FunderCollateralBalances,
} from "@/lib/trading/deposit-wallet-convert";
import {
  isStableflowSuccessStatus,
  isStableflowTerminalFailureStatus,
  pollStableflowExecution,
} from "@/lib/trading/stableflow-bridge-status";
import { fundingNetworkTypeToChainType, transferDepositFunds } from "@/lib/wallet";
import { fetchJson } from "@/lib/team/client-fetch";
import type {
  BridgeAggregateStatus,
  BridgeFlowStatus,
  BridgeStatusResponse,
  BridgeTransactionRecord,
  DepositAddressesPayload,
} from "@/types/funding";
import type { StableflowDepositContext } from "@/views/portfolio/deposit/types";

export interface UseDepositResult {
  status: BridgeFlowStatus;
  bridgeStatus: BridgeAggregateStatus;
  transactions: BridgeTransactionRecord[];
  error: string | undefined;
  getBridgeDepositAddresses: () => Promise<DepositAddressesPayload>;
  depositViaPolygon: (amountUsd: string, token: FundingAsset) => Promise<{ txHash: string; statusAddress: string }>;
  depositViaStableflow: (
    amount: string,
    token: StableflowDepositToken,
    funderAddress: string,
    polygonUsdcDestinationAssetId: string,
  ) => Promise<StableflowDepositContext>;
  depositViaNearStableflow: (
    amount: string,
    token: StableflowDepositToken,
    funderAddress: string,
    polygonUsdcDestinationAssetId: string,
    quote?: QuoteResponse,
  ) => Promise<StableflowDepositContext>;
  pollStableflowBridge: (
    depositAddress: string,
    depositMemo: string | undefined,
    onUpdate?: (status: OneClickStatus) => void,
  ) => Promise<OneClickStatus>;
  pollFunderCollateralBalances: (
    onUpdate?: (balances: FunderCollateralBalances) => void,
  ) => Promise<FunderCollateralBalances>;
  startStatusPoll: (statusAddress: string) => Promise<BridgeAggregateStatus>;
  stopStatusPoll: () => void;
  supportedAssets: FundingAsset[];
}

export function useDeposit(): UseDepositResult {
  const { session, syncCash } = useAuth();
  const [status, setStatus] = useState<BridgeFlowStatus>("idle");
  const [bridgeStatus, setBridgeStatus] = useState<BridgeAggregateStatus>("pending");
  const [transactions, setTransactions] = useState<BridgeTransactionRecord[]>([]);
  const [error, setError] = useState<string | undefined>();
  const pollAbortRef = useRef<AbortController | undefined>(undefined);
  const stableflowPollAbortRef = useRef<AbortController | undefined>(undefined);
  const funderBalancePollAbortRef = useRef<AbortController | undefined>(undefined);
  const { supportedAssets } = useSupportedAssets();

  const fetchDepositStatus = useCallback(async (statusAddress: string) => {
    const payload = await fetchJson<{ status: BridgeStatusResponse }>(
      `/api/trading/deposit?statusAddress=${encodeURIComponent(statusAddress)}`,
    );

    return payload.status;
  }, []);

  const stopStatusPoll = useCallback(() => {
    pollAbortRef.current?.abort();
    pollAbortRef.current = undefined;
    stableflowPollAbortRef.current?.abort();
    stableflowPollAbortRef.current = undefined;
    funderBalancePollAbortRef.current?.abort();
    funderBalancePollAbortRef.current = undefined;
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
        const message = syncError instanceof Error ? syncError.message : String(syncError);
        const missingClobCredentials = /CLOB credentials are required/i.test(message);

        if (missingClobCredentials) {
          setStatus("success");
          setError(
            "Deposit completed. Complete Step 2 in the Enable trading dialog to sync your tradable balance.",
          );
          return aggregateStatus;
        }

        setStatus("error");
        setError(message);
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
          fetchStatus: fetchDepositStatus,
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
          setError("Bridge deposit did not complete successfully.");
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
    [bridgeStatus, fetchDepositStatus, finalizeIfCompleted, stopStatusPoll],
  );

  const getBridgeDepositAddresses = useCallback(async () => {
    setStatus("preparing");
    setError(undefined);

    try {
      const payload = await fetchJson<DepositAddressesPayload>("/api/trading/deposit");
      setStatus("idle");
      return payload;
    } catch (prepareError) {
      setStatus("error");
      setError(prepareError instanceof Error ? prepareError.message : String(prepareError));
      throw prepareError;
    }
  }, []);

  const depositViaPolygon = async (amountUsd: string, token: FundingAsset) => {
    const transferWalletAddress = requiresFundingWalletConnection(token)
      ? resolveFundingWalletAddress(token)
      : session?.walletAddress;

    if (!transferWalletAddress) {
      throw new Error("Connect a wallet before depositing funds.");
    }

    setStatus("preparing");
    setError(undefined);

    try {
      const addresses = await getBridgeDepositAddresses();
      const bridgeAddress =
        token.chainType === FundingNetworkType.SVM
          ? addresses.deposit.address.svm
          : token.chainType === FundingNetworkType.TVM
            ? addresses.deposit.address.tvm
            : addresses.deposit.address.evm;

      if (!bridgeAddress) {
        throw new Error("Bridge did not return a deposit address for the selected chain.");
      }

      setStatus("awaiting_wallet");
      const { txHash } = await transferDepositFunds({
        chainType: fundingNetworkTypeToChainType(token.chainType),
        walletAddress: transferWalletAddress,
        tokenAddress: token.address,
        toAddress: bridgeAddress,
        amount: amountUsd,
        tokenDecimals: token.decimals,
        chainId: token.chainId,
        symbol: token.symbol,
      });

      const aggregateStatus = await startStatusPoll(bridgeAddress);

      if (!isTerminalBridgeStatus(aggregateStatus)) {
        throw new Error("Deposit status polling ended before completion.");
      }

      return { txHash, statusAddress: bridgeAddress };
    } catch (depositError) {
      if (status !== "syncing") {
        setStatus("error");
      }

      setError(depositError instanceof Error ? depositError.message : String(depositError));
      throw depositError;
    }
  };

  const resolveStableflowTransferWallet = (token: StableflowDepositToken): string => {
    if (requiresFundingWalletConnection(token)) {
      const fundingAddress = resolveFundingWalletAddress(token);

      if (!fundingAddress) {
        throw new Error(`Connect a ${token.chainName} wallet before depositing funds.`);
      }

      return fundingAddress;
    }

    if (!session?.walletAddress) {
      throw new Error("Connect a wallet before depositing funds.");
    }

    return session.walletAddress;
  };

  const depositViaStableflow = async (
    amount: string,
    token: StableflowDepositToken,
    funderAddress: string,
    polygonUsdcDestinationAssetId: string,
  ): Promise<StableflowDepositContext> => {
    const transferWalletAddress = resolveStableflowTransferWallet(token);

    setStatus("preparing");
    setError(undefined);

    const amountBaseUnits = parseUnits(amount, token.decimals).toString();
    const refundTo =
      getStableflowRefundAddress({
        blockchain: token.blockchain,
        walletAddress: transferWalletAddress,
      }) ?? transferWalletAddress;

    if (isPolygonNativeUsdcToken(token)) {
      setStatus("awaiting_wallet");
      const { txHash } = await transferDepositFunds({
        chainType: fundingNetworkTypeToChainType(token.chainType),
        walletAddress: transferWalletAddress,
        tokenAddress: token.address,
        toAddress: funderAddress,
        amount,
        tokenDecimals: token.decimals,
        chainId: token.chainId,
        symbol: token.symbol,
      });

      setStatus("idle");

      return {
        skipBridgePoll: true,
        txHash,
        expectedAmountBaseUnits: amountBaseUnits,
      };
    }

    const { quote } = await fetchJson<{ quote: QuoteResponse }>("/api/trading/stableflow/quote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        originAssetId: token.assetId,
        destinationAssetId: polygonUsdcDestinationAssetId,
        amountBaseUnits,
        refundTo,
        recipient: funderAddress,
        originBlockchain: token.blockchain,
      }),
    });

    const depositAddress = quote.quote.depositAddress;

    if (!depositAddress) {
      throw new Error("Stableflow quote did not return a deposit address.");
    }

    setStatus("awaiting_wallet");
    const { txHash } = await transferDepositFunds({
      chainType: fundingNetworkTypeToChainType(token.chainType),
      walletAddress: transferWalletAddress,
      tokenAddress: token.address,
      toAddress: depositAddress,
      amount,
      tokenDecimals: token.decimals,
      chainId: token.chainId,
      symbol: token.symbol,
    });

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

    setStatus("idle");

    return {
      quote,
      depositAddress,
      depositMemo: quote.quote.depositMemo,
      txHash,
      expectedAmountBaseUnits: amountBaseUnits,
    };
  };

  const depositViaNearStableflow = async (
    amount: string,
    token: StableflowDepositToken,
    funderAddress: string,
    polygonUsdcDestinationAssetId: string,
    existingQuote?: QuoteResponse,
  ): Promise<StableflowDepositContext> => {
    const nearAccountId = getNearAccountSnapshot().accountId;

    if (!nearAccountId) {
      throw new Error("Connect a NEAR wallet before depositing funds.");
    }

    setStatus("preparing");
    setError(undefined);

    const amountBaseUnits = parseUnits(amount, token.decimals).toString();
    const refundTo = getStableflowRefundAddress({
      blockchain: token.blockchain,
      nearAccountId,
    });

    if (!refundTo) {
      throw new Error("NEAR account is not available for this deposit.");
    }

    const quote =
      existingQuote ??
      (
        await fetchJson<{ quote: QuoteResponse }>("/api/trading/stableflow/quote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            originAssetId: token.assetId,
            destinationAssetId: polygonUsdcDestinationAssetId,
            amountBaseUnits,
            refundTo,
            recipient: funderAddress,
            originBlockchain: token.blockchain,
          }),
        })
      ).quote;

    const depositAddress = quote.quote.depositAddress;

    if (!depositAddress) {
      throw new Error("Stableflow quote did not return a deposit address.");
    }

    setStatus("awaiting_wallet");
    const { txHash } = await transferNearFtToken({
      contractId: token.address,
      depositAddress,
      amountBaseUnits,
    });

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

    setStatus("idle");

    return {
      quote,
      depositAddress,
      depositMemo: quote.quote.depositMemo,
      txHash,
      expectedAmountBaseUnits: amountBaseUnits,
    };
  };

  const pollStableflowBridge = useCallback(
    async (
      depositAddress: string,
      depositMemo: string | undefined,
      onUpdate?: (status: OneClickStatus) => void,
    ) => {
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
        onUpdate,
      });

      if (isStableflowTerminalFailureStatus(finalStatus)) {
        throw new Error(`Stableflow bridge did not complete successfully (${finalStatus}).`);
      }

      if (!isStableflowSuccessStatus(finalStatus)) {
        throw new Error(`Stableflow bridge ended in unexpected status (${finalStatus}).`);
      }

      return finalStatus;
    },
    [],
  );

  const pollFunderCollateralBalances = useCallback(
    async (onUpdate?: (balances: FunderCollateralBalances) => void) => {
      funderBalancePollAbortRef.current?.abort();
      const controller = new AbortController();
      funderBalancePollAbortRef.current = controller;

      const maxAttempts = 120;
      const intervalMs = 5000;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        if (controller.signal.aborted) {
          throw new DOMException("Funder balance polling aborted.", "AbortError");
        }

        const payload = await fetchFunderCollateralBalances();
        onUpdate?.(payload);

        if (resolvePendingDepositConvertMode(payload)) {
          return payload;
        }

        await delay(intervalMs, controller.signal);
      }

      throw new Error("Timed out waiting for USDC or USDC.e to arrive in the deposit wallet.");
    },
    [],
  );

  return {
    status,
    bridgeStatus,
    transactions,
    error,
    getBridgeDepositAddresses,
    depositViaPolygon,
    depositViaStableflow,
    depositViaNearStableflow,
    pollStableflowBridge,
    pollFunderCollateralBalances,
    startStatusPoll,
    stopStatusPoll,
    supportedAssets,
  };
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Polling aborted.", "AbortError"));
      return;
    }

    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException("Polling aborted.", "AbortError"));
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
