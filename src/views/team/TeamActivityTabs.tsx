"use client";

import { useState } from "react";

import { TabSwitcher } from "../../components/ui/TabSwitcher";
import { TeamPositionsTable } from "./TeamPositionsTable";
import { TeamTopTradersTable } from "./TeamTopTradersTable";
import { TeamTradesTable, TeamTradesTableHeader } from "./TeamTradesTable";
import { teamDetailPanelClass } from "./teamDetailUi";
import type { TeamMarketSnapshot } from "../../types/market";

const ACTIVITY_TABS = [
  { id: "trades", label: "Trades" },
  { id: "position", label: "Position" },
  { id: "top-traders", label: "Top Traders" }
] as const;

type ActivityTabId = (typeof ACTIVITY_TABS)[number]["id"];

export interface TeamActivityTabsProps {
  snapshot: TeamMarketSnapshot;
}

export function TeamActivityTabs({ snapshot }: TeamActivityTabsProps) {
  const [tab, setTab] = useState<ActivityTabId>("trades");

  return (
    <div className="flex flex-col gap-0">
      <div className={teamDetailPanelClass}>
        <div className="border-b border-prophet-line px-4 pt-3">
          <TabSwitcher
            items={[...ACTIVITY_TABS]}
            value={tab}
            onChange={(value) => setTab(value as ActivityTabId)}
            aria-label="Market activity"
          />
        </div>

        {tab === "trades" ? <TeamTradesTableHeader /> : null}
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

        {tab === "trades" ? <TeamTradesTable /> : null}
        {tab === "position" ? (
          <div aria-label="Your positions">
            <TeamPositionsTable snapshot={snapshot} />
          </div>
        ) : null}
        {tab === "top-traders" ? (
          <div aria-label="Top traders">
            <TeamTopTradersTable />
          </div>
        ) : null}
      </div>
    </div>
  );
}
