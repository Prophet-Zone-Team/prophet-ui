"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

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

const ACTIVITY_TAB_IDS = ["trades", "position", "top-holders"] as const;

type ActivityTabId = (typeof ACTIVITY_TAB_IDS)[number];

export interface ActivityTabsProps {
  snapshot: TeamMarketSnapshot;
}

export function ActivityTabs({ snapshot }: ActivityTabsProps) {
  const t = useTranslations("trade");
  const [tab, setTab] = useState<ActivityTabId>("trades");
  const [visitedTabs, setVisitedTabs] = useState<Set<ActivityTabId>>(
    () => new Set(["trades"]),
  );

  const activityTabs = useMemo(
    () => [
      { id: "trades" as const, label: t("tabTrades") },
      { id: "position" as const, label: t("tabPosition") },
      { id: "top-holders" as const, label: t("tabTopHolders") }
    ],
    [t]
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
    <div className="flex flex-col gap-0 rounded-[12px] border border-prophet-line bg-prophet-panel">
      <div className={tradeSectionClass}>
        <div className="border-b border-prophet-line px-4 pt-4">
          <TabSwitcher
            items={activityTabs}
            value={tab}
            onChange={handleTabChange}
            aria-label={t("marketActivity")}
          />
        </div>

        {tab === "trades" ? <TradesTableHeader /> : null}
        {tab === "position" ? (
          <div
            className="grid grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))] gap-2 border-b border-prophet-line px-4 py-2 text-xs text-prophet-muted"
            aria-hidden={tab !== "position"}
          >
            <span>{t("outcome")}</span>
            <span>{t("size")}</span>
            <span>{t("value")}</span>
            <span>{t("pnl")}</span>
            <span>{t("avg")}</span>
          </div>
        ) : null}
        {tab === "top-holders" ? <TopHoldersTableHeader /> : null}

        {visitedTabs.has("trades") ? (
          <div
            hidden={tab !== "trades"}
            className="min-h-[500px]"
            aria-label={t("marketTradesAria")}
          >
            <TradesTable snapshot={snapshot} active={tab === "trades"} />
          </div>
        ) : null}
        {visitedTabs.has("position") ? (
          <div
            hidden={tab !== "position"}
            className="min-h-[500px]"
            aria-label={t("marketPositionsAria")}
          >
            <PositionsTable snapshot={snapshot} active={tab === "position"} />
          </div>
        ) : null}
        {visitedTabs.has("top-holders") ? (
          <div
            hidden={tab !== "top-holders"}
            className="min-h-[500px]"
            aria-label={t("topHoldersAria")}
          >
            <TopHoldersTable
              snapshot={snapshot}
              active={tab === "top-holders"}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
