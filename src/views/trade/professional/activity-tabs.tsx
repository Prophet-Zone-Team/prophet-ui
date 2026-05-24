"use client";

import { useState } from "react";

import { TabSwitcher } from "@/components/ui/tab-switcher";
import { PositionsTable } from "@/views/trade/professional/positions-table";
import { TopTradersTable } from "@/views/trade/professional/top-traders-table";
import {
  TradesTable,
  TradesTableHeader
} from "@/views/trade/professional/trades-table";
import { tradeSectionClass } from "@/views/trade/trade-widget/trade-ui";
import type { GameMarketSnapshot, TeamMarketSnapshot } from "@/types/market";

const ACTIVITY_TABS = [
  { id: "trades", label: "Trades" },
  { id: "position", label: "Position" },
  { id: "top-traders", label: "Top Traders" }
] as const;

type ActivityTabId = (typeof ACTIVITY_TABS)[number]["id"];

export type ActivityTabsTeamProps = {
  variant?: "team";
  snapshot: TeamMarketSnapshot;
};

export type ActivityTabsGameProps = {
  variant: "game";
  gameSnapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
};

export type ActivityTabsProps = ActivityTabsTeamProps | ActivityTabsGameProps;

export function ActivityTabs(props: ActivityTabsProps) {
  const [tab, setTab] = useState<ActivityTabId>("trades");

  return (
    <div className="flex flex-col gap-0">
      <div className={tradeSectionClass}>
        <div className="border-b border-prophet-line px-4 pt-3">
          <TabSwitcher
            items={[...ACTIVITY_TABS]}
            value={tab}
            onChange={(value) => setTab(value as ActivityTabId)}
            aria-label="Market activity"
          />
        </div>

        {tab === "trades" ? <TradesTableHeader /> : null}
        {tab === "position" ? (
          <div
            className="grid grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))] gap-2 border-b border-prophet-line px-4 py-2 text-xs text-prophet-muted"
            aria-hidden={tab !== "position"}
          >
            <span>Outcome</span>
            <span>Size</span>
            <span>Value</span>
            <span>PnL</span>
            <span>Avg</span>
          </div>
        ) : null}
        {tab === "top-traders" ? (
          <div className="border-b border-prophet-line px-4 py-2 text-xs text-prophet-muted">
            Trader leaderboard
          </div>
        ) : null}

        {tab === "trades" ? <TradesTable /> : null}
        {tab === "position" ? (
          <div aria-label="Your positions">
            {props.variant === "game" ? (
              <PositionsTable
                variant="game"
                gameSnapshot={props.gameSnapshot}
                teamSnapshots={props.teamSnapshots}
              />
            ) : (
              <PositionsTable snapshot={props.snapshot} />
            )}
          </div>
        ) : null}
        {tab === "top-traders" ? (
          <div aria-label="Top traders">
            <TopTradersTable />
          </div>
        ) : null}
      </div>
    </div>
  );
}
