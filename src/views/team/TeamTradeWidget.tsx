"use client";

import { useState } from "react";

import { TabSwitcher } from "../../components/ui/TabSwitcher";
import type { OrderOutcomeSide, TeamMarketSnapshot } from "../../types/market";
import { TeamBuyPanel } from "./TeamBuyPanel";
import { TeamSellPlaceholder } from "./TeamSellPlaceholder";
import { TeamTradeHeader } from "./TeamTradeHeader";
import { TeamTradeMarketButton } from "./TeamTradeMarketButton";
import { teamDetailPanelClass } from "./teamDetailUi";

const TRADE_TABS = [
  { id: "buy", label: "Buy" },
  { id: "sell", label: "Sell" }
] as const;

type TradeTabId = (typeof TRADE_TABS)[number]["id"];

export interface TeamTradeWidgetProps {
  snapshot: TeamMarketSnapshot;
}

export function TeamTradeWidget({ snapshot }: TeamTradeWidgetProps) {
  const [tab, setTab] = useState<TradeTabId>("buy");
  const [outcomeSide, setOutcomeSide] = useState<OrderOutcomeSide>("yes");

  return (
    <section
      id="trade"
      className={teamDetailPanelClass}
      aria-label="Place order"
    >
      <TeamTradeHeader
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
        {tab === "buy" ? <TeamTradeMarketButton /> : null}
      </div>

      {tab === "buy" ? (
        <TeamBuyPanel
          snapshot={snapshot}
          outcomeSide={outcomeSide}
          onOutcomeSideChange={setOutcomeSide}
        />
      ) : null}
      {tab === "sell" ? <TeamSellPlaceholder /> : null}
    </section>
  );
}
