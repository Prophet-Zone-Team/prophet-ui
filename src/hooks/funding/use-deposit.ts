"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/context/auth";
import { isTerminalBridgeStatus, pollBridgeAddress } from "@/lib/trading/bridge-status";
import { transferCollateralFromConnectedWallet } from "@/lib/trading/polygon-collateral-transfer";
import { fetchJson } from "@/lib/team/client-fetch";
import type {
  BridgeAggregateStatus,
  BridgeFlowStatus,
  BridgeStatusResponse,
  BridgeTransactionRecord,
  DepositAddressesPayload,
  SupportedAssetsPayload,
} from "@/types/funding";
import { FUNDING_TOKENS_LIST, FundingAsset } from "@/config/funding";

export interface UseDepositResult {
  status: BridgeFlowStatus;
  bridgeStatus: BridgeAggregateStatus;
  transactions: BridgeTransactionRecord[];
  error: string | undefined;
  getBridgeDepositAddresses: () => Promise<DepositAddressesPayload>;
  depositViaPolygon: (amountUsd: string, token: FundingAsset) => Promise<{ txHash: string; statusAddress: string }>;
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

  const [supportedAssets, setSupportedAssets] = useState<FundingAsset[]>([]);

  const fetchDepositStatus = useCallback(async (statusAddress: string) => {
    const payload = await fetchJson<{ status: BridgeStatusResponse }>(
      `/api/trading/deposit?statusAddress=${encodeURIComponent(statusAddress)}`,
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
    if (!session?.walletAddress) {
      throw new Error("Connect a wallet before depositing funds.");
    }

    setStatus("preparing");
    setError(undefined);

    try {
      const addresses = await getBridgeDepositAddresses();
      const bridgeEvm = addresses.deposit.address.evm;

      if (!bridgeEvm) {
        throw new Error("Bridge did not return an EVM deposit address.");
      }

      setStatus("awaiting_wallet");
      const { txHash } = await transferCollateralFromConnectedWallet({
        walletAddress: session.walletAddress,
        tokenAddress: token.address,
        toAddress: bridgeEvm,
        amountUsd,
        tokenDecimals: token.decimals,
        chainId: token.chainId,
      });

      const aggregateStatus = await startStatusPoll(bridgeEvm);

      if (!isTerminalBridgeStatus(aggregateStatus)) {
        throw new Error("Deposit status polling ended before completion.");
      }

      return { txHash, statusAddress: bridgeEvm };
    } catch (depositError) {
      if (status !== "syncing") {
        setStatus("error");
      }

      setError(depositError instanceof Error ? depositError.message : String(depositError));
      throw depositError;
    }
  };

  const getSupportedAssets = async () => {
    try {
      const payload = await fetchJson<SupportedAssetsPayload>("https://bridge.polymarket.com/supported-assets");
      const { supportedAssets } = payload;

      // Determine which tokens to display based on local configuration
      const displayTokens: FundingAsset[] = FUNDING_TOKENS_LIST.map((token) => {
        const current = supportedAssets.find((asset) => {
          return token.address.toLowerCase() === asset.token.address.toLowerCase()
            && token.chainId.toString() === asset.chainId;
        });
        if (!current) {
          return null;
        }
        return {
          ...token,
          minCheckoutUsd: current.minCheckoutUsd,
          name: current.token.name,
        };
      }).filter((token) => token !== null);
      console.log("displayTokens: %o", displayTokens);

      setSupportedAssets(displayTokens);
    } catch (error) {
      console.log("getSupportedAssets failed: %o", error);
      setSupportedAssets([]);
    }
  };

  useEffect(() => {
    getSupportedAssets();
  }, []);

  return {
    status,
    bridgeStatus,
    transactions,
    error,
    getBridgeDepositAddresses,
    depositViaPolygon,
    startStatusPoll,
    stopStatusPoll,
    supportedAssets,
  };
}
