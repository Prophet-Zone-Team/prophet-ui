"use client";

import { useState } from "react";

import { TabSwitcher } from "../../../components/ui/TabSwitcher";
import { resolveMatchSides } from "../../../lib/market/scheduleMatch";
import type { GameMarketSnapshot, MatchOutcomeSide } from "../../../types/market";
import { TeamFlag } from "../../../components/teams/TeamFlag";
import type { TeamMarketSnapshot } from "../../../types/market";
import { SellPlaceholder } from "../SellPlaceholder";
import { tradePanelClass } from "../tradeUi";
import { GameBuyPanel } from "./GameBuyPanel";

const TRADE_TABS = [
  { id: "buy", label: "Buy" },
  { id: "sell", label: "Sell" }
] as const;

type TradeTabId = (typeof TRADE_TABS)[number]["id"];

export interface GameTradeWidgetProps {
  snapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
}

export function GameTradeWidget({
  snapshot,
  teamSnapshots
}: GameTradeWidgetProps) {
  const [tab, setTab] = useState<TradeTabId>("buy");
  const [outcomeSide, setOutcomeSide] = useState<MatchOutcomeSide>("home");
  const sides = resolveMatchSides(snapshot.match, teamSnapshots);
  const selectedOutcome = snapshot.outcomes.find((item) => item.side === outcomeSide);

  return (
    <section id="trade" className={tradePanelClass} aria-label="Place match order">
      <div className="flex items-start gap-2.5 px-4 pt-4">
        <div className="flex -space-x-2">
          <TeamFlag
            code={sides.home.code}
            name={sides.home.name}
            className="!h-9 !w-9 shrink-0 rounded-md shadow-[0_0_2px_rgba(0,0,0,0.2)]"
          />
          <TeamFlag
            code={sides.away.code}
            name={sides.away.name}
            className="!h-9 !w-9 shrink-0 rounded-md shadow-[0_0_2px_rgba(0,0,0,0.2)]"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 line-clamp-2 text-sm font-[556] leading-[17px] text-black">
            {sides.home.name} vs {sides.away.name}
          </p>
          {tab === "buy" && selectedOutcome ? (
            <p className="m-0 mt-0.5 text-base font-[556] leading-[19px] text-[#65AF14]">
              {selectedOutcome.label}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 border-b border-prophet-line px-4 pb-0 pt-3">
        <TabSwitcher
          items={[...TRADE_TABS]}
          value={tab}
          onChange={(value) => setTab(value as TradeTabId)}
          size="compact"
          aria-label="Trade side"
        />
      </div>

      {tab === "buy" ? (
        <GameBuyPanel
          snapshot={snapshot}
          outcomeSide={outcomeSide}
          onOutcomeSideChange={setOutcomeSide}
        />
      ) : null}
      {tab === "sell" ? <SellPlaceholder /> : null}
    </section>
  );
}
