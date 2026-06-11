"use client";

import type { OneClickStatus, QuoteResponse } from "@stableflow/core";
import { useCallback, useRef } from "react";
import { parseUnits } from "viem";

import {
  getConfidentialStatus,
  requestConfidentialTopupQuote,
  submitConfidentialDepositTx,
} from "@/lib/confidential/client";
import type { StableflowDepositToken } from "@/lib/funding/stableflow";
import { fundingNetworkTypeToChainType, transferDepositFunds } from "@/lib/wallet";
import {
  isStableflowSuccessStatus,
  isStableflowTerminalFailureStatus,
  pollStableflowExecution,
} from "@/lib/trading/stableflow-bridge-status";

export interface ConfidentialTopupExecution {
  quote: QuoteResponse;
  depositAddress: string;
  depositMemo?: string;
  txHash: string;
  expectedAmountBaseUnits: string;
}

export interface UseConfidentialTopupResult {
  requestQuote: (params: {
    token: StableflowDepositToken;
    tokenAmount: string;
    fundingAddress: string;
    destinationAssetId: string;
  }) => Promise<QuoteResponse>;
  executeTopup: (params: {
    token: StableflowDepositToken;
    tokenAmount: string;
    fundingAddress: string;
    quote: QuoteResponse;
  }) => Promise<ConfidentialTopupExecution>;
  pollTopupStatus: (
    depositAddress: string,
    depositMemo: string | undefined,
    onUpdate?: (status: OneClickStatus) => void,
  ) => Promise<OneClickStatus>;
  stopStatusPoll: () => void;
}

/**
 * Confidential top up: move funds from the connected Funding Wallet into the
 * user's Confidential account (ORIGIN_CHAIN -> CONFIDENTIAL_INTENTS). The
 * server pins the recipient to the authenticated intentsUserId.
 */
export function useConfidentialTopup(): UseConfidentialTopupResult {
  const statusPollAbortRef = useRef<AbortController | undefined>(undefined);

  const requestQuote = useCallback(
    async ({
      token,
      tokenAmount,
      fundingAddress,
      destinationAssetId,
    }: {
      token: StableflowDepositToken;
      tokenAmount: string;
      fundingAddress: string;
      destinationAssetId: string;
    }) => {
      const amountBaseUnits = parseUnits(tokenAmount, token.decimals).toString();
      const { quote } = await requestConfidentialTopupQuote({
        originAssetId: token.assetId,
        destinationAssetId,
        amountBaseUnits,
        refundTo: fundingAddress,
      });

      if (!quote.quote.depositAddress) {
        throw new Error("Quote did not return a deposit address.");
      }

      return quote;
    },
    [],
  );

  const executeTopup = useCallback(
    async ({
      token,
      tokenAmount,
      fundingAddress,
      quote,
    }: {
      token: StableflowDepositToken;
      tokenAmount: string;
      fundingAddress: string;
      quote: QuoteResponse;
    }): Promise<ConfidentialTopupExecution> => {
      const depositAddress = quote.quote.depositAddress;

      if (!depositAddress) {
        throw new Error("Quote did not return a deposit address.");
      }

      const amountBaseUnits = parseUnits(tokenAmount, token.decimals).toString();

      // transferDepositFunds switches the funding wallet to the token's chain
      // before sending, so no separate ensure-chain call is needed here.
      const { txHash } = await transferDepositFunds({
        chainType: fundingNetworkTypeToChainType(token.chainType),
        walletAddress: fundingAddress,
        tokenAddress: token.address,
        toAddress: depositAddress,
        amount: tokenAmount,
        tokenDecimals: token.decimals,
        chainId: token.chainId,
      });

      await submitConfidentialDepositTx({
        txHash,
        depositAddress,
        memo: quote.quote.depositMemo,
      });

      return {
        quote,
        depositAddress,
        depositMemo: quote.quote.depositMemo,
        txHash,
        expectedAmountBaseUnits: amountBaseUnits,
      };
    },
    [],
  );

  const pollTopupStatus = useCallback(
    async (
      depositAddress: string,
      depositMemo: string | undefined,
      onUpdate?: (status: OneClickStatus) => void,
    ) => {
      statusPollAbortRef.current?.abort();
      const controller = new AbortController();
      statusPollAbortRef.current = controller;

      const fetchStatus = async (address: string, memo?: string) => {
        const payload = await getConfidentialStatus(address, memo);
        return { status: payload.status as OneClickStatus };
      };

      const finalStatus = await pollStableflowExecution({
        fetchStatus,
        depositAddress,
        depositMemo,
        signal: controller.signal,
        onUpdate,
      });

      if (isStableflowTerminalFailureStatus(finalStatus)) {
        throw new Error(`Top up did not complete successfully (${finalStatus}).`);
      }

      if (!isStableflowSuccessStatus(finalStatus)) {
        throw new Error(`Top up ended in an unexpected status (${finalStatus}).`);
      }

      return finalStatus;
    },
    [],
  );

  const stopStatusPoll = useCallback(() => {
    statusPollAbortRef.current?.abort();
    statusPollAbortRef.current = undefined;
  }, []);

  return { requestQuote, executeTopup, pollTopupStatus, stopStatusPoll };
}
