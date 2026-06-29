"use client";

import { cn } from "@/lib/cn";
import { tradePageClass } from "@/views/trade/trade-widget/trade-ui";

import { CopyTradeActivityPanel } from "./activity-panel";
import { CopyTradeFundingHost } from "./funding/copy-trade-funding-host";
import { CopyTradeListPanel } from "./list";
import { CopyTradeUserProfile } from "./user-profile";

export function CopyTradePage() {
  return (
    <div className={cn(tradePageClass, "pb-10 md:pt-2")}>
      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_355px] xl:items-stretch">
        <div className="order-2 min-w-0 xl:order-1">
          <CopyTradeListPanel />
        </div>

        <aside className="order-1 flex min-h-0 min-w-0 flex-col gap-4 xl:order-2 xl:sticky xl:top-14 xl:self-stretch">
          <CopyTradeUserProfile className="w-full shrink-0 xl:w-[355px]" />
          <CopyTradeActivityPanel className="w-full min-h-0 flex-0 xl:w-[355px]" />
        </aside>
      </div>

      <CopyTradeFundingHost />
    </div>
  );
}

export { ImportWalletModal } from "./import-wallet-modal";
export type { ImportWalletModalProps } from "./import-wallet-modal";
export { WalletCopyModal } from "./wallet-copy-modal";
export type {
  WalletCopyFormValues,
  WalletCopyModalProps,
  WalletCopyTraderStats
} from "./wallet-copy-modal";
export { buildWalletCopyStatsFromTrader } from "./wallet-copy-modal";
export { useCopyActions } from "./use-copy-actions";
export { useCopyTradeProfile } from "./use-copy-trade-profile";
export { useCopyTradeReadiness } from "./use-copy-trade-readiness";
export { useCopyTradeSession } from "./use-copy-trade-session";
export { useCopyTradeTest } from "./use-copy-trade-test";
export {
  useCopyTradeRank,
  COPY_TRADE_TRADERS_QUERY_KEY,
  fetchCopyTradeTraders
} from "./use-copy-trade-rank";
export { useCopyTradeTargets } from "./use-copy-trade-targets";
