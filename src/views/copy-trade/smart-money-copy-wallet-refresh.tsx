"use client";

import { useCopyWalletRefreshOnEntry } from "@/hooks/copy-trade/use-copy-wallet-refresh-on-entry";

export function SmartMoneyCopyWalletRefresh() {
  useCopyWalletRefreshOnEntry();
  return null;
}
