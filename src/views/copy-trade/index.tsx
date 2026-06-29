"use client";

import { cn } from "@/lib/cn";
import { tradePageClass } from "@/views/trade/trade-widget/trade-ui";

import { CopyTradeFundingHost } from "./funding/copy-trade-funding-host";
import { CopyTradeListPanel } from "./list";
import { CopyTradeUserProfile } from "./user-profile";

export function CopyTradePage() {
  return (
    <div className={cn(tradePageClass, "pb-10 md:pt-2")}>
      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_355px] xl:items-start">
        <div className="order-2 min-w-0 xl:order-1">
          <CopyTradeListPanel />
        </div>

        <aside className="order-1 min-w-0 xl:order-2 xl:sticky xl:top-14">
          <CopyTradeUserProfile className="w-full xl:w-[355px]" />
        </aside>
      </div>

      <CopyTradeFundingHost />
    </div>
  );
}

export { WalletCopyModal } from "./wallet-copy-modal";
export type {
  WalletCopyFormValues,
  WalletCopyModalProps,
  WalletCopyTraderStats
} from "./wallet-copy-modal";
export {
  buildWalletCopyFormFromTarget,
  buildWalletCopyStatsFromTrader
} from "./wallet-copy-modal";
export { useCopyTradeTest } from "./use-copy-trade-test";
export { useCopyTradeSession } from "./use-copy-trade-session";
export { useCopyTradeRank, COPY_TRADE_TRADERS_QUERY_KEY, fetchCopyTradeTraders } from "./use-copy-trade-rank";
export { useCopyTradeTargets } from "./use-copy-trade-targets";
