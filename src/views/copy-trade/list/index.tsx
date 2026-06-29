"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { TabSwitcher, type TabSwitcherItem } from "@/components/ui/tab-switcher";
import { cn } from "@/lib/cn";
import { CopyTradeCopiedWalletPanel } from "@/views/copy-trade/copied-wallet";
import { CopyTradeRankPanel } from "@/views/copy-trade/rank";

type CopyTradeListTabId = "rank" | "copied-wallet";

export interface CopyTradeListPanelProps {
  className?: string;
}

export function CopyTradeListPanel({ className }: CopyTradeListPanelProps) {
  const t = useTranslations("copyTrade.list");
  const [tab, setTab] = useState<CopyTradeListTabId>("rank");

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

  return (
    <section
      className={cn("flex min-w-0 flex-col", className)}
      aria-label={t("ariaTraders")}
    >
      <div className="px-4 pt-2 md:px-0 md:pt-0">
        <TabSwitcher
          items={tabs}
          value={tab}
          onChange={(value) => setTab(value as CopyTradeListTabId)}
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
