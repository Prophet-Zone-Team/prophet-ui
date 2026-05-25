"use client";

import type { DepositWalletBatchSignablePayload } from "@/lib/market/deposit-wallet-batch";
import { fetchJson } from "@/lib/team/client-fetch";

interface RelayerTransactionRecord {
  transactionID?: string;
  transactionHash?: string;
  state?: string;
}

export function isRelayerMinedState(state: string | undefined) {
  return Boolean(
    state &&
      (state.includes("MINED") || state.includes("CONFIRMED") || state.includes("EXECUTED")),
  );
}

export function isRelayerFailureState(state: string | undefined) {
  return Boolean(state && (state.includes("FAILED") || state.includes("INVALID") || state.includes("REVERTED")));
}

export function isWalletBusyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return /wallet busy/i.test(message) || /active action exists/i.test(message);
}

export async function pollRelayerTransaction(
  transactionId: string,
  options: {
    statusApiPath: string;
    maxAttempts?: number;
    intervalMs?: number;
    onStatus?: (message: string) => void;
    errorPrefix?: string;
  },
): Promise<RelayerTransactionRecord> {
  const maxAttempts = options.maxAttempts ?? 90;
  const intervalMs = options.intervalMs ?? 2000;
  const errorPrefix = options.errorPrefix ?? "Relayer transaction";
  let lastState: string | undefined;
  let lastTransaction: RelayerTransactionRecord | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await delay(intervalMs);

    const payload = await fetchJson<{ transaction?: RelayerTransactionRecord }>(
      `${options.statusApiPath}?transactionId=${encodeURIComponent(transactionId)}`,
    );
    const transaction = payload.transaction;
    lastTransaction = transaction;
    const state = transaction?.state;
    lastState = state;

    if (isRelayerMinedState(state)) {
      options.onStatus?.("Transaction confirmed on chain.");
      return transaction ?? {};
    }

    if (isRelayerFailureState(state)) {
      throw new Error(`${errorPrefix} ${state}.`);
    }

    options.onStatus?.(`Transaction pending (${state ?? "unknown"})...`);
  }

  throw new Error(
    `${errorPrefix} ${transactionId} timed out before confirmation. Last state: ${lastState ?? "unknown"}.`,
  );
}

export async function submitDepositWalletBatchWithRetry({
  submit,
  payload,
  onStatus,
  maxAttempts = 20,
  intervalMs = 2000,
}: {
  submit: (payload: {
    transfer: DepositWalletBatchSignablePayload;
    signature: string;
  }) => Promise<{ response?: { transactionID?: string; state?: string } }>;
  payload: { transfer: DepositWalletBatchSignablePayload; signature: string };
  onStatus?: (message: string) => void;
  maxAttempts?: number;
  intervalMs?: number;
}) {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await submit(payload);
    } catch (error) {
      lastError = error;

      if (!isWalletBusyError(error) || attempt >= maxAttempts - 1) {
        throw error;
      }

      onStatus?.("Deposit wallet is finishing the previous step. Retrying…");
      await delay(intervalMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
