import type { BridgeAggregateStatus, BridgeStatusResponse, BridgeTransactionRecord } from "../../types/funding";

const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED"]);

export function normalizeBridgeAggregateStatus(
  transactions: BridgeTransactionRecord[] | undefined,
): BridgeAggregateStatus {
  if (!transactions?.length) {
    return "pending";
  }

  if (transactions.some((transaction) => transaction.status === "FAILED")) {
    return "failed";
  }

  if (transactions.every((transaction) => transaction.status && TERMINAL_STATUSES.has(transaction.status))) {
    return transactions.some((transaction) => transaction.status === "COMPLETED") ? "completed" : "failed";
  }

  return "pending";
}

export function isTerminalBridgeStatus(status: BridgeAggregateStatus): boolean {
  return status === "completed" || status === "failed";
}

export interface PollBridgeAddressOptions {
  fetchStatus: (statusAddress: string) => Promise<BridgeStatusResponse>;
  statusAddress: string;
  intervalMs?: number;
  maxAttempts?: number;
  onUpdate?: (payload: { status: BridgeAggregateStatus; response: BridgeStatusResponse }) => void;
  signal?: AbortSignal;
}

export async function pollBridgeAddress({
  fetchStatus,
  statusAddress,
  intervalMs = 15_000,
  maxAttempts = 40,
  onUpdate,
  signal,
}: PollBridgeAddressOptions): Promise<{
  status: BridgeAggregateStatus;
  response: BridgeStatusResponse;
}> {
  let lastResponse: BridgeStatusResponse = { transactions: [] };

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (signal?.aborted) {
      throw new Error("Bridge status polling was cancelled.");
    }

    lastResponse = await fetchStatus(statusAddress);
    const status = normalizeBridgeAggregateStatus(lastResponse.transactions);
    onUpdate?.({ status, response: lastResponse });

    if (isTerminalBridgeStatus(status)) {
      return { status, response: lastResponse };
    }

    await sleep(intervalMs, signal);
  }

  return {
    status: normalizeBridgeAggregateStatus(lastResponse.transactions),
    response: lastResponse,
  };
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Bridge status polling was cancelled."));
      return;
    }

    const timeout = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      window.clearTimeout(timeout);
      reject(new Error("Bridge status polling was cancelled."));
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
