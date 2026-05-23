"use client";

import { useState } from "react";

import { TabSwitcher } from "@/components/ui/tab-switcher";
import type {
  OrderOutcomeSide,
  TeamMarketSnapshot
} from "@/types/market";
import { ActionPanel } from "@/views/trade/trade-widget/action-panel";
import { SellPlaceholder } from "@/views/trade/trade-widget/sell-placeholder";
import { TradeWidgetHeader } from "@/views/trade/trade-widget/header";
import {
  TradeMarketButton,
  type TradeOrderMode
} from "@/views/trade/trade-widget/trade-market-button";
import { tradePanelClass } from "@/views/trade/trade-widget/trade-ui";

const TRADE_TABS = [
  { id: "buy", label: "Buy" },
  { id: "sell", label: "Sell" }
] as const;

type TradeTabId = (typeof TRADE_TABS)[number]["id"];

export interface TradeWidgetProps {
  snapshot: TeamMarketSnapshot;
}

export function TradeWidget({ snapshot }: TradeWidgetProps) {
  const [tab, setTab] = useState<TradeTabId>("buy");
  const [outcomeSide, setOutcomeSide] = useState<OrderOutcomeSide>("yes");
  const [orderMode, setOrderMode] = useState<TradeOrderMode>("market");
  return (
    <section className={tradePanelClass} aria-label="Place order">
      <TradeWidgetHeader
        snapshot={snapshot}
        outcomeSide={outcomeSide}
        showOutcomeLabel={tab === "buy"}
      />

      <div className="flex items-end justify-between gap-3 border-b border-prophet-line px-4 pb-0 pt-3">
        <TabSwitcher
          items={[...TRADE_TABS]}
          value={tab}
          onChange={(value) => setTab(value as TradeTabId)}
          size="compact"
          aria-label="Trade side"
        />
        <TradeMarketButton value={orderMode} onChange={setOrderMode} />
      </div>
      <ActionPanel
        snapshot={snapshot}
        outcomeSide={outcomeSide}
        orderMode={orderMode}
        onOutcomeSideChange={setOutcomeSide}
      />
    </section>
  );
}
