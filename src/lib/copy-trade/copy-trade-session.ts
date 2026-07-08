"use client";

import { logoutCopyTradeWalletSession } from "@/lib/copy-trade/auth";
import { useCopyTradeStore } from "@/store/copy-trade-store";

export type { CopyTradeStoredSession } from "@/types/copy-trade-api";

/** Clears copy-trade session from the persisted store. */
export function clearCopyTradeLocalCache(): void {
  useCopyTradeStore.getState().clearSession();
}

export async function clearCopyTradeSession(): Promise<void> {
  try {
    await logoutCopyTradeWalletSession();
  } catch {
    // Best-effort server logout; local cache is always cleared.
  }

  clearCopyTradeLocalCache();
}
