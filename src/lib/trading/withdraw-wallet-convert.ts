"use client";

import { FUNDING_NETWORKS } from "@/config/funding/networks";
import { ensureFundingEvmChain } from "@/lib/funding/ensure-funding-evm-chain";
import type { DepositWalletBatchSignablePayload } from "@/lib/market/deposit-wallet-batch";
import { fetchJson } from "@/lib/team/client-fetch";
import {
  pollRelayerTransaction,
  submitDepositWalletBatchWithRetry,
} from "@/lib/trading/deposit-wallet-relayer";
import { signTypedData } from "@/lib/trading/wallet-typed-data-sign";

const WITHDRAW_CONVERT_STATUS_PATH = "/api/trading/withdraw-convert";
const WITHDRAW_CONVERT_CHAIN_ID = FUNDING_NETWORKS.polygon.chainId;

export type WithdrawConvertPhase = "pusd-to-usdce" | "usdce-to-usdc";

export async function ensureWithdrawConvertPolygonChain(walletAddress: string) {
  await ensureFundingEvmChain(walletAddress, WITHDRAW_CONVERT_CHAIN_ID);
}

export async function prepareWithdrawConvertBatch(
  phase: WithdrawConvertPhase,
  amountUsd: string,
  swapRecipient?: string,
) {
  const search = new URLSearchParams({
    phase,
    amount: amountUsd,
  });

  if (phase === "usdce-to-usdc" && swapRecipient) {
    search.set("swapRecipient", swapRecipient);
  }

  return fetchJson<{
    funderAddress: string;
    phase: WithdrawConvertPhase;
    transfer: DepositWalletBatchSignablePayload;
  }>(`${WITHDRAW_CONVERT_STATUS_PATH}?${search.toString()}`);
}

export async function submitWithdrawConvertBatch({
  transfer,
  signature,
}: {
  transfer: DepositWalletBatchSignablePayload;
  signature: string;
}) {
  return fetchJson<{ response?: { transactionID?: string; state?: string } }>(WITHDRAW_CONVERT_STATUS_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transfer,
      signature,
    }),
  });
}

export async function executeWithdrawConvertPhase({
  walletAddress,
  phase,
  amountUsd,
  swapRecipient,
  onStatus,
}: {
  walletAddress: string;
  phase: WithdrawConvertPhase;
  amountUsd: string;
  swapRecipient?: string;
  onStatus?: (message: string) => void;
}) {
  const { transfer } = await prepareWithdrawConvertBatch(phase, amountUsd, swapRecipient);
  onStatus?.(
    phase === "pusd-to-usdce"
      ? "Sign to unwrap pUSD to USDC.e…"
      : "Sign to swap USDC.e to USDC…",
  );

  const signature = await signTypedData(walletAddress, transfer);
  onStatus?.("Submitting signed batch to relayer…");

  const response = await submitDepositWalletBatchWithRetry({
    submit: submitWithdrawConvertBatch,
    payload: { transfer, signature },
    onStatus,
  });
  const transactionId = response.response?.transactionID;

  if (!transactionId) {
    throw new Error("Withdraw convert did not return a relayer transaction id.");
  }

  const transaction = await pollRelayerTransaction(transactionId, {
    statusApiPath: WITHDRAW_CONVERT_STATUS_PATH,
    onStatus,
    errorPrefix: "Withdraw convert transaction",
  });

  const txHash = transaction.transactionHash;

  if (!txHash) {
    throw new Error("Withdraw convert did not return an on-chain transaction hash.");
  }

  return { transactionId, txHash };
}
