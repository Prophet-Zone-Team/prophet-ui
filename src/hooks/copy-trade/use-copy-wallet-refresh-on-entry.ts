"use client";

import { useEffect, useRef } from "react";

import {
  refreshCopyWalletIfStale,
  shouldRefreshCopyWalletBeforeLiveCopy,
} from "@/lib/copy-trade/auth";
import { useAuthHydrated } from "@/store/use-auth-hydrated";
import { useCopyTradeStore } from "@/store/copy-trade-store";
import { useCopyTradeHydrated } from "@/store/use-copy-trade-hydrated";

export function useCopyWalletRefreshOnEntry() {
  const authHydrated = useAuthHydrated();
  const copyTradeHydrated = useCopyTradeHydrated();
  const userId = useCopyTradeStore((state) => state.user?.ID);
  const copyWallet = useCopyTradeStore((state) => state.copyWallet);
  const updateCopyWallet = useCopyTradeStore((state) => state.updateCopyWallet);
  const attemptedRef = useRef(false);

  const hydrated = authHydrated && copyTradeHydrated;

  useEffect(() => {
    if (!hydrated || attemptedRef.current || !userId) {
      return;
    }

    if (!shouldRefreshCopyWalletBeforeLiveCopy(copyWallet)) {
      return;
    }

    attemptedRef.current = true;
    void refreshCopyWalletIfStale(userId, copyWallet, updateCopyWallet);
  }, [copyWallet, hydrated, updateCopyWallet, userId]);
}
