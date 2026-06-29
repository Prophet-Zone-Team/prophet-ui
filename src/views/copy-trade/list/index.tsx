"use client";

import { useState } from "react";

import { TabSwitcher } from "@/components/ui/tab-switcher";
import { cn } from "@/lib/cn";
import { CopyTradeCopiedWalletPanel } from "@/views/copy-trade/copied-wallet";
import { CopyTradeRankPanel } from "@/views/copy-trade/rank";

const COPY_TRADE_LIST_TABS = [
  { id: "rank", label: "Rank" },
  { id: "copied-wallet", label: "Copied Wallet" }
] as const;

type CopyTradeListTabId = (typeof COPY_TRADE_LIST_TABS)[number]["id"];

export interface CopyTradeListPanelProps {
  className?: string;
}

export function CopyTradeListPanel({ className }: CopyTradeListPanelProps) {
  const [tab, setTab] = useState<CopyTradeListTabId>("rank");

  return (
    <section
      className={cn("flex min-w-0 flex-col", className)}
      aria-label="Copy trade traders"
    >
      <div className="px-4 pt-2 md:px-0 md:pt-0">
        <TabSwitcher
          items={COPY_TRADE_LIST_TABS.map((item) => ({
            id: item.id,
            label: item.label
          }))}
          value={tab}
          onChange={(value) => setTab(value as CopyTradeListTabId)}
          aria-label="Copy trade list tabs"
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
