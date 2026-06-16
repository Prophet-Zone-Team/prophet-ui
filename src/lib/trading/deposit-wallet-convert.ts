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

const DEPOSIT_CONVERT_STATUS_PATH = "/api/trading/deposit-convert";

const DEPOSIT_CONVERT_CHAIN_ID = FUNDING_NETWORKS.polygon.chainId;

export async function ensureDepositConvertPolygonChain(walletAddress: string) {
  await ensureFundingEvmChain(walletAddress, DEPOSIT_CONVERT_CHAIN_ID);
}

export type DepositConvertPhase = "usdc-to-usdce" | "usdce-to-pusd";

export async function prepareDepositConvertBatch(phase: DepositConvertPhase, amountUsd: string) {
  const search = new URLSearchParams({
    phase,
    amount: amountUsd,
  });

  return fetchJson<{
    funderAddress: string;
    phase: DepositConvertPhase;
    transfer: DepositWalletBatchSignablePayload;
  }>(`/api/trading/deposit-convert?${search.toString()}`);
}

export async function submitDepositConvertBatch({
  transfer,
  signature,
}: {
  transfer: DepositWalletBatchSignablePayload;
  signature: string;
}) {
  return fetchJson<{ response?: { transactionID?: string; state?: string } }>("/api/trading/deposit-convert", {
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

export interface FunderTokenBalance {
  balance: string;
  balanceBaseUnits: string;
}

export interface FunderCollateralBalances {
  funderAddress: string;
  usdc: FunderTokenBalance;
  usdce: FunderTokenBalance;
}

export type PendingDepositConvertMode = "full" | "wrap-only";

export async function fetchFunderCollateralBalances(): Promise<FunderCollateralBalances> {
  const payload = await fetchJson<
    FunderCollateralBalances & {
      balance?: string;
      balanceBaseUnits?: string;
    }
  >("/api/trading/deposit-convert?funderBalance=1");

  return {
    funderAddress: payload.funderAddress,
    usdc: payload.usdc ?? {
      balance: payload.balance ?? "0",
      balanceBaseUnits: payload.balanceBaseUnits ?? "0",
    },
    usdce: payload.usdce ?? {
      balance: "0",
      balanceBaseUnits: "0",
    },
  };
}

/** @deprecated Use fetchFunderCollateralBalances */
export async function fetchFunderUsdcBalance() {
  const balances = await fetchFunderCollateralBalances();

  return {
    funderAddress: balances.funderAddress,
    balance: balances.usdc.balance,
    balanceBaseUnits: balances.usdc.balanceBaseUnits,
  };
}

export function resolvePendingDepositConvertMode(
  balances: FunderCollateralBalances,
): PendingDepositConvertMode | null {
  try {
    const usdcBaseUnits = BigInt(balances.usdc.balanceBaseUnits || "0");
    const usdceBaseUnits = BigInt(balances.usdce.balanceBaseUnits || "0");

    if (usdcBaseUnits > 0n) {
      return "full";
    }

    if (usdceBaseUnits > 0n) {
      return "wrap-only";
    }

    return null;
  } catch {
    return null;
  }
}

export function getPendingConvertAmountUsd(
  balances: FunderCollateralBalances,
  mode: PendingDepositConvertMode,
): string {
  if (mode === "wrap-only") {
    return balances.usdce.balance;
  }

  return balances.usdc.balance;
}

export async function pollRelayerTransaction(
  transactionId: string,
  options?: {
    maxAttempts?: number;
    intervalMs?: number;
    onStatus?: (message: string) => void;
  },
) {
  await pollRelayerTransactionShared(transactionId, {
    statusApiPath: DEPOSIT_CONVERT_STATUS_PATH,
    maxAttempts: options?.maxAttempts,
    intervalMs: options?.intervalMs,
    onStatus: options?.onStatus,
    errorPrefix: "Deposit convert transaction",
  });

  return true;
}

export async function executeDepositConvertPhase({
  walletAddress,
  phase,
  amountUsd,
  onStatus,
}: {
  walletAddress: string;
  phase: DepositConvertPhase;
  amountUsd: string;
  onStatus?: (message: string) => void;
}) {
  const { transfer } = await prepareDepositConvertBatch(phase, amountUsd);
  onStatus?.(phase === "usdc-to-usdce" ? "Sign to convert USDC to USDC.e…" : "Sign to wrap USDC.e to pUSD…");

  const signature = await signTypedData(walletAddress, transfer);
  onStatus?.("Submitting signed batch to relayer…");

  const response = await submitDepositWalletBatchWithRetry({
    submit: submitDepositConvertBatch,
    payload: { transfer, signature },
    onStatus,
  });
  const transactionId = response.response?.transactionID;

  if (!transactionId) {
    throw new Error("Deposit convert did not return a relayer transaction id.");
  }

  await pollRelayerTransaction(transactionId, { onStatus });

  return { transactionId };
}

export async function executePendingDepositConvert({
  walletAddress,
  mode,
  amountUsd,
  onStatus,
}: {
  walletAddress: string;
  mode: PendingDepositConvertMode;
  amountUsd: string;
  onStatus?: (message: string) => void;
}) {
  onStatus?.("Checking wallet network…");
  await ensureDepositConvertPolygonChain(walletAddress);
  let finalTransactionId: string;

  if (mode === "full") {
    onStatus?.("Step 1/2: Converting USDC to USDC.e…");
    const { transactionId } = await executeDepositConvertPhase({
      walletAddress,
      phase: "usdc-to-usdce",
      amountUsd,
      onStatus,
    });

    finalTransactionId = transactionId;
    onStatus?.("Waiting for deposit wallet to become ready…");
    await delay(DEPOSIT_WALLET_IDLE_DELAY_MS);
  }

  const wrapAmountUsd =
    mode === "full" ? await resolveFunderUsdceWrapAmount(onStatus) : amountUsd;

  onStatus?.(
    mode === "wrap-only"
      ? "Wrapping USDC.e to pUSD…"
      : "Step 2/2: Wrapping USDC.e to pUSD…",
  );
  const { transactionId } = await executeDepositConvertPhase({
    walletAddress,
    phase: "usdce-to-pusd",
    amountUsd: wrapAmountUsd,
    onStatus,
  });

  finalTransactionId = transactionId;

  return { transactionId: finalTransactionId };
}

export async function executeFullDepositConvert({
  walletAddress,
  amountUsd,
  onStatus,
}: {
  walletAddress: string;
  amountUsd: string;
  onStatus?: (message: string) => void;
}) {
  await executePendingDepositConvert({
    walletAddress,
    mode: "full",
    amountUsd,
    onStatus,
  });
}

const DEPOSIT_WALLET_IDLE_DELAY_MS = 1_500;
const USDC_E_BALANCE_POLL_INTERVAL_MS = 2_000;
const USDC_E_BALANCE_MAX_ATTEMPTS = 20;
export async function resolveFunderUsdceWrapAmount(onStatus?: (message: string) => void): Promise<string> {
  for (let attempt = 0; attempt < USDC_E_BALANCE_MAX_ATTEMPTS; attempt += 1) {
    const balances = await fetchFunderCollateralBalances();
    const usdceBaseUnits = BigInt(balances.usdce.balanceBaseUnits || "0");

    if (usdceBaseUnits > 0n) {
      return balances.usdce.balance;
    }

    onStatus?.("Waiting for USDC.e balance to update…");
    await delay(USDC_E_BALANCE_POLL_INTERVAL_MS);
  }

  throw new Error("USDC.e is not available on the deposit wallet after conversion.");
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

