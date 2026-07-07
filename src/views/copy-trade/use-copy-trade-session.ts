"use client";

import {
  useCopyTradeStore,
  useCopyTradeStoredSession,
} from "@/store/copy-trade-store";
import { useCopyTradeHydrated } from "@/store/use-copy-trade-hydrated";

export function useCopyTradeSession() {
  const hydrated = useCopyTradeHydrated();
  const session = useCopyTradeStoredSession();
  const walletAddress = useCopyTradeStore((state) => state.walletAddress);
  const user = useCopyTradeStore((state) => state.user);

  return {
    session,
    hydrated,
    userId: user?.ID,
    walletAddress: walletAddress ?? undefined,
  };
}
