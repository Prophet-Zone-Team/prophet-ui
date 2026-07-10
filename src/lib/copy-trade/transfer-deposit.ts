import {
  getCopyTradeTransferDeposit
} from "@/service/copy-trade";
import type {
  CopyTransferDeposit,
  CopyTransferDepositStatus
} from "@/types/copy-trade-funding";

export const COPY_TRANSFER_DEPOSIT_POLL_INTERVAL_MS = 12_000;
export const COPY_TRANSFER_DEPOSIT_POLL_TIMEOUT_MS = 15 * 60 * 1000;

const TERMINAL_STATUSES = new Set<CopyTransferDepositStatus>([
  "credited",
  "invalid",
  "ambiguous"
]);

export function isCopyTransferDepositTerminal(
  status: string | undefined
): boolean {
  return TERMINAL_STATUSES.has(status as CopyTransferDepositStatus);
}

export function isCopyTransferDepositSuccess(
  status: string | undefined
): boolean {
  return status === "credited";
}

export function isCopyTransferDepositFailure(
  status: string | undefined
): boolean {
  return status === "invalid" || status === "ambiguous";
}

export interface PollCopyTradeTransferDepositOptions {
  intervalMs?: number;
  timeoutMs?: number;
  onUpdate?: (record: CopyTransferDeposit) => void;
}

export async function pollCopyTradeTransferDeposit(
  txHash: string,
  options: PollCopyTradeTransferDepositOptions = {}
): Promise<CopyTransferDeposit> {
  const intervalMs =
    options.intervalMs ?? COPY_TRANSFER_DEPOSIT_POLL_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? COPY_TRANSFER_DEPOSIT_POLL_TIMEOUT_MS;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const record = await getCopyTradeTransferDeposit(txHash);
      options.onUpdate?.(record);

      if (isCopyTransferDepositTerminal(record.status)) {
        return record;
      }
    } catch (error) {
      throw error;
    }

    await sleep(intervalMs);
  }

  throw new Error("Transfer deposit status polling timed out.");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
