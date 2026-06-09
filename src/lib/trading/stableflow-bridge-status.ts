import { OneClickStatus } from "@stableflow/core";

const STABLEFLOW_PENDING_STATUSES = new Set<OneClickStatus>([
  OneClickStatus.PENDING_DEPOSIT,
  OneClickStatus.KNOWN_DEPOSIT_TX,
  OneClickStatus.INCOMPLETE_DEPOSIT,
  OneClickStatus.PROCESSING,
]);

const STABLEFLOW_TERMINAL_FAILURE_STATUSES = new Set<OneClickStatus>([
  OneClickStatus.FAILED,
  OneClickStatus.REFUNDED,
]);

export function isStableflowPendingStatus(status: OneClickStatus): boolean {
  return STABLEFLOW_PENDING_STATUSES.has(status);
}

export function isStableflowSuccessStatus(status: OneClickStatus): boolean {
  return status === OneClickStatus.SUCCESS;
}

export function isStableflowTerminalFailureStatus(status: OneClickStatus): boolean {
  return STABLEFLOW_TERMINAL_FAILURE_STATUSES.has(status);
}

export function isStableflowTerminalStatus(status: OneClickStatus): boolean {
  return isStableflowSuccessStatus(status) || isStableflowTerminalFailureStatus(status);
}

export function isStableflowAwaitingDepositStatus(status: OneClickStatus): boolean {
  return (
    status === OneClickStatus.PENDING_DEPOSIT ||
    status === OneClickStatus.INCOMPLETE_DEPOSIT
  );
}

export async function pollStableflowUntilDepositDetected({
  fetchStatus,
  depositAddress,
  depositMemo,
  signal,
  intervalMs = 5000,
  maxAttempts = 120,
  onUpdate,
}: {
  fetchStatus: (depositAddress: string, depositMemo?: string) => Promise<{ status: OneClickStatus }>;
  depositAddress: string;
  depositMemo?: string;
  signal?: AbortSignal;
  intervalMs?: number;
  maxAttempts?: number;
  onUpdate?: (status: OneClickStatus) => void;
}): Promise<OneClickStatus> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (signal?.aborted) {
      throw new DOMException("Stableflow status polling aborted.", "AbortError");
    }

    const payload = await fetchStatus(depositAddress, depositMemo);
    onUpdate?.(payload.status);

    if (!isStableflowAwaitingDepositStatus(payload.status)) {
      return payload.status;
    }

    await delay(intervalMs, signal);
  }

  throw new Error("Stableflow deposit detection polling timed out.");
}

export async function pollStableflowExecution({
  fetchStatus,
  depositAddress,
  depositMemo,
  signal,
  intervalMs = 5000,
  maxAttempts = 120,
  onUpdate,
}: {
  fetchStatus: (depositAddress: string, depositMemo?: string) => Promise<{ status: OneClickStatus }>;
  depositAddress: string;
  depositMemo?: string;
  signal?: AbortSignal;
  intervalMs?: number;
  maxAttempts?: number;
  onUpdate?: (status: OneClickStatus) => void;
}): Promise<OneClickStatus> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (signal?.aborted) {
      throw new DOMException("Stableflow status polling aborted.", "AbortError");
    }

    const payload = await fetchStatus(depositAddress, depositMemo);
    onUpdate?.(payload.status);

    if (isStableflowTerminalStatus(payload.status)) {
      return payload.status;
    }

    await delay(intervalMs, signal);
  }

  throw new Error("Stableflow bridge status polling timed out before completion.");
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Stableflow status polling aborted.", "AbortError"));
      return;
    }

    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException("Stableflow status polling aborted.", "AbortError"));
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
