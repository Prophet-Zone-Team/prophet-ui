"use client";

import { FUNDING_NETWORKS } from "@/config/funding/networks";
import { ensureFundingEvmChain } from "@/lib/funding/ensure-funding-evm-chain";
import type { DepositWalletBatchSignablePayload } from "@/lib/market/deposit-wallet-batch";
import { fetchJson } from "@/lib/team/client-fetch";
import {
  pollRelayerTransaction as pollRelayerTransactionShared,
  submitDepositWalletBatchWithRetry,
} from "@/lib/trading/deposit-wallet-relayer";
import { signTypedData } from "@/lib/trading/wallet-typed-data-sign";

const REDEEM_STATUS_PATH = "/api/trading/redeem";
const REDEEM_CHAIN_ID = FUNDING_NETWORKS.polygon.chainId;

export async function ensureRedeemPolygonChain(walletAddress: string) {
  await ensureFundingEvmChain(walletAddress, REDEEM_CHAIN_ID);
}

export async function prepareRedeemBatch(conditionId: string) {
  const search = new URLSearchParams({
    conditionId,
  });

  return fetchJson<{
    funderAddress: string;
    conditionId: string;
    negativeRisk: boolean;
    transfer: DepositWalletBatchSignablePayload;
  }>(`${REDEEM_STATUS_PATH}?${search.toString()}`);
}

export async function submitRedeemBatch({
  transfer,
  signature,
}: {
  transfer: DepositWalletBatchSignablePayload;
  signature: string;
}) {
  return fetchJson<{ response?: { transactionID?: string; state?: string } }>(REDEEM_STATUS_PATH, {
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

export async function executeRedeem({
  walletAddress,
  conditionId,
  onStatus,
}: {
  walletAddress: string;
  conditionId: string;
  onStatus?: (message: string) => void;
}) {
  onStatus?.("Checking wallet network…");
  await ensureRedeemPolygonChain(walletAddress);

  onStatus?.("Preparing redeem transaction…");
  const { transfer } = await prepareRedeemBatch(conditionId);

  onStatus?.("Sign to redeem resolved position tokens…");
  const signature = await signTypedData(walletAddress, transfer);

  onStatus?.("Submitting signed batch to relayer…");
  const response = await submitDepositWalletBatchWithRetry({
    submit: submitRedeemBatch,
    payload: { transfer, signature },
    onStatus,
  });
  const transactionId = response.response?.transactionID;

  if (!transactionId) {
    throw new Error("Redeem did not return a relayer transaction id.");
  }

  const transaction = await pollRelayerTransactionShared(transactionId, {
    statusApiPath: REDEEM_STATUS_PATH,
    onStatus,
    errorPrefix: "Redeem transaction",
  });

  return {
    transactionId,
    txHash: transaction.transactionHash ?? transactionId,
  };
}
