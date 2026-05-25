"use client";

import { FUNDING_NETWORKS } from "@/config/funding/networks";
import { ensureFundingEvmChain } from "@/lib/funding/ensure-funding-evm-chain";
import type { DepositWalletBatchSignablePayload } from "@/lib/market/deposit-wallet-batch";
import { fetchJson } from "@/lib/team/client-fetch";
import { signTypedData } from "@/lib/trading/wallet-typed-data-sign";

const DEPOSIT_CONVERT_CHAIN_ID = FUNDING_NETWORKS.polygon.chainId;

export async function ensureDepositConvertPolygonChain(walletAddress: string) {
  await ensureFundingEvmChain(walletAddress, DEPOSIT_CONVERT_CHAIN_ID);
}

export type DepositConvertPhase = "usdc-to-usdce" | "usdce-to-pusd";

interface RelayerTransactionRecord {
  transactionID?: string;
  state?: string;
}

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
  const maxAttempts = options?.maxAttempts ?? 90;
  const intervalMs = options?.intervalMs ?? 2000;
  let lastState: string | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await delay(intervalMs);

    const payload = await fetchJson<{ transaction?: RelayerTransactionRecord }>(
      `/api/trading/deposit-convert?transactionId=${encodeURIComponent(transactionId)}`,
    );
    const state = payload.transaction?.state;
    lastState = state;

    if (isRelayerMinedState(state)) {
      options?.onStatus?.("Transaction confirmed on chain.");
      return true;
    }

    if (isRelayerFailureState(state)) {
      throw new Error(`Deposit convert transaction ${state}.`);
    }

    options?.onStatus?.(`Transaction pending (${state ?? "unknown"})...`);
  }

  throw new Error(
    `Deposit convert transaction ${transactionId} timed out before confirmation. Last state: ${lastState ?? "unknown"}.`,
  );
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

  const response = await submitDepositConvertBatchWithRetry({ transfer, signature }, onStatus);
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

  if (mode === "full") {
    onStatus?.("Step 1/2: Converting USDC to USDC.e…");
    await executeDepositConvertPhase({
      walletAddress,
      phase: "usdc-to-usdce",
      amountUsd,
      onStatus,
    });

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
  await executeDepositConvertPhase({
    walletAddress,
    phase: "usdce-to-pusd",
    amountUsd: wrapAmountUsd,
    onStatus,
  });
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
const WALLET_BUSY_RETRY_INTERVAL_MS = 2_000;
const WALLET_BUSY_MAX_ATTEMPTS = 20;

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

async function submitDepositConvertBatchWithRetry(
  payload: { transfer: DepositWalletBatchSignablePayload; signature: string },
  onStatus?: (message: string) => void,
) {
  let lastError: unknown;

  for (let attempt = 0; attempt < WALLET_BUSY_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await submitDepositConvertBatch(payload);
    } catch (error) {
      lastError = error;

      if (!isWalletBusyError(error) || attempt >= WALLET_BUSY_MAX_ATTEMPTS - 1) {
        throw error;
      }

      onStatus?.("Deposit wallet is finishing the previous step. Retrying…");
      await delay(WALLET_BUSY_RETRY_INTERVAL_MS);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function isRelayerMinedState(state: string | undefined) {
  return Boolean(state && (state.includes("MINED") || state.includes("CONFIRMED")));
}

function isRelayerFailureState(state: string | undefined) {
  return Boolean(state && (state.includes("FAILED") || state.includes("INVALID") || state.includes("REVERTED")));
}

function isWalletBusyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return /wallet busy/i.test(message) || /active action exists/i.test(message);
}
