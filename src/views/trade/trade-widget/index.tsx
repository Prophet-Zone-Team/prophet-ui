"use client";

import { useState } from "react";

import { TabSwitcher } from "../../../components/ui/tab-switcher";
import type {
  OrderOutcomeSide,
  TeamMarketSnapshot
} from "../../../types/market";
import { BuyPanel } from "./buy-panel";
import { SellPlaceholder } from "./sell-placeholder";
import { TradeWidgetHeader } from "./header";
import { TradeMarketButton } from "./trade-market-button";
import { tradePanelClass } from "./trade-ui";

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

  return (
    <section id="trade" className={tradePanelClass} aria-label="Place order">
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
        {tab === "buy" ? <TradeMarketButton /> : null}
      </div>

      {tab === "buy" ? (
        <BuyPanel
          snapshot={snapshot}
          outcomeSide={outcomeSide}
          onOutcomeSideChange={setOutcomeSide}
        />
      ) : null}
      {tab === "sell" ? <SellPlaceholder /> : null}
    </section>
  );
}
