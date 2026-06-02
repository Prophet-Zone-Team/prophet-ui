"use client";

import { useCallback, useState } from "react";

import { TabSwitcher } from "@/components/ui/tab-switcher";
import { PositionsTable } from "@/views/trade/team/positions-table";
import {
  TopHoldersTable,
  TopHoldersTableHeader
} from "@/views/trade/team/top-holders-table";
import {
  TradesTable,
  TradesTableHeader
} from "@/views/trade/team/trades-table";
import { tradeSectionClass } from "@/views/trade/trade-widget/trade-ui";
import type { TeamMarketSnapshot } from "@/types/market";

const ACTIVITY_TABS = [
  { id: "trades", label: "Trades" },
  { id: "position", label: "Position" },
  { id: "top-holders", label: "Top Holders" }
] as const;

type ActivityTabId = (typeof ACTIVITY_TABS)[number]["id"];

export interface ActivityTabsProps {
  snapshot: TeamMarketSnapshot;
}

export function ActivityTabs({ snapshot }: ActivityTabsProps) {
  const [tab, setTab] = useState<ActivityTabId>("trades");
  const [visitedTabs, setVisitedTabs] = useState<Set<ActivityTabId>>(
    () => new Set(["trades"]),
  );

  const handleTabChange = useCallback((value: string) => {
    const nextTab = value as ActivityTabId;
    setTab(nextTab);
    setVisitedTabs((current) => {
      if (current.has(nextTab)) {
        return current;
      }

      const next = new Set(current);
      next.add(nextTab);
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col gap-0 bg-white border-[#EBEBEB] border rounded-[12px]">
      <div className={tradeSectionClass}>
        <div className="border-b border-prophet-line px-4 pt-4">
          <TabSwitcher
            items={[...ACTIVITY_TABS]}
            value={tab}
            onChange={handleTabChange}
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
        {tab === "top-holders" ? <TopHoldersTableHeader /> : null}

        {visitedTabs.has("trades") ? (
          <div hidden={tab !== "trades"} aria-label="Market trades">
            <TradesTable snapshot={snapshot} />
          </div>
        ) : null}
        {visitedTabs.has("position") ? (
          <div hidden={tab !== "position"} aria-label="Market positions">
            <PositionsTable snapshot={snapshot} />
          </div>
        ) : null}
        {visitedTabs.has("top-holders") ? (
          <div hidden={tab !== "top-holders"} aria-label="Top holders">
            <TopHoldersTable snapshot={snapshot} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
