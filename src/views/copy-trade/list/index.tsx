"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";

import { TabSwitcher, type TabSwitcherItem } from "@/components/ui/tab-switcher";
import { cn } from "@/lib/cn";
import { CopyTradeCopiedWalletPanel } from "@/views/copy-trade/copied-wallet";
import { CopyTradeRankPanel } from "@/views/copy-trade/rank";
import { CopyTradeRankSummaryHero } from "@/views/copy-trade/rank/summary-hero";
import { useCopyTradeTraderSummary } from "@/views/copy-trade/use-copy-trade-trader-summary";

const COPY_TRADE_LIST_TAB_IDS = ["rank", "copied-wallet"] as const;

type CopyTradeListTabId = (typeof COPY_TRADE_LIST_TAB_IDS)[number];

function parseCopyTradeListTab(value: string | null): CopyTradeListTabId | null {
  if (value && COPY_TRADE_LIST_TAB_IDS.some((id) => id === value)) {
    return value as CopyTradeListTabId;
  }

  return null;
}

export interface CopyTradeListPanelProps {
  className?: string;
}

export function CopyTradeListPanel({ className }: CopyTradeListPanelProps) {
  const t = useTranslations("copyTrade.list");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = parseCopyTradeListTab(searchParams.get("tab")) ?? "rank";
  const { data: traderSummary, isLoading: isSummaryLoading } =
    useCopyTradeTraderSummary();

  const tabs = useMemo<TabSwitcherItem[]>(
    () => [
      { id: "rank", label: t("tabRank") },
      {
        id: "copied-wallet",
        label: t("tabCopiedWallet"),
        mobileLabel: t("tabCopiedWalletMobile")
      }
    ],
    [t]
  );

  const handleTabChange = useCallback(
    (value: string) => {
      const nextTab = parseCopyTradeListTab(value);

      if (!nextTab) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());

      if (nextTab === "rank") {
        params.delete("tab");
      } else {
        params.set("tab", nextTab);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <section
      className={cn("flex min-w-0 flex-col", className)}
      aria-label={t("ariaTraders")}
    >
      <CopyTradeRankSummaryHero
        totalPnL={traderSummary?.TotalPnL}
        isLoading={isSummaryLoading}
        className="pb-4 pt-2 md:pt-0"
      />

      <div className="px-4 md:px-0">
        <TabSwitcher
          items={tabs}
          value={tab}
          onChange={handleTabChange}
          aria-label={t("ariaTabs")}
        />
      </div>

      {tab === "rank" ? (
        <CopyTradeRankPanel enabled />
      ) : (
        <CopyTradeCopiedWalletPanel enabled />
      )}
    </section>
  );
}
