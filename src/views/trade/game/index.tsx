"use client";

import { useState } from "react";

import type { MarketDataMeta } from "@/data/providers/types";
import type {
  GameMarketSnapshot,
  GameProbabilityHistoryPoint,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import { TradesTable, TradesTableHeader } from "@/views/trade/trades-table";
import { tradePageClass, tradeSectionClass } from "@/views/trade/trade-widget/trade-ui";
import { TabSwitcher } from "@/components/ui/tab-switcher";
import { GameProbabilitySection } from "@/views/trade/game/game-probability-section";
import { GameTradeHeader } from "@/views/trade/game/game-trade-header";
import { GameTradeWidget } from "@/views/trade/game/game-trade-widget";
import { MatchTeamLinks, RelatedMatchGames } from "@/views/trade/game/related-match-games";

const ACTIVITY_TABS = [
  { id: "trades", label: "Trades" },
  { id: "context", label: "Context" }
] as const;

type ActivityTabId = (typeof ACTIVITY_TABS)[number]["id"];

export interface TradeGameProViewProps {
  snapshot: GameMarketSnapshot;
  probabilityHistory: GameProbabilityHistoryPoint[];
  teamSnapshots: TeamMarketSnapshot[];
  relatedMatches: WorldCupMatch[];
  dataStatus: MarketDataMeta;
  embedded?: boolean;
}

export function TradeGameProView({
  snapshot,
  probabilityHistory,
  teamSnapshots,
  relatedMatches,
  embedded = false
}: TradeGameProViewProps) {
  const [showOrderbook, setShowOrderbook] = useState(true);
  const [tab, setTab] = useState<ActivityTabId>("trades");

  const content = (
    <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_345px] xl:items-start">
      <div className="order-2 flex min-w-0 flex-col gap-4 xl:order-1">
        <GameTradeHeader
          snapshot={snapshot}
          teamSnapshots={teamSnapshots}
          showOrderbook={showOrderbook}
          onOrderbookChange={setShowOrderbook}
        />
        <GameProbabilitySection
          snapshot={snapshot}
          probabilityHistory={probabilityHistory}
          teamSnapshots={teamSnapshots}
          showOrderbook={showOrderbook}
        />
        <div className={tradeSectionClass}>
          <div className="border-b border-prophet-line px-4 pt-3">
            <TabSwitcher
              items={[...ACTIVITY_TABS]}
              value={tab}
              onChange={(value) => setTab(value as ActivityTabId)}
              aria-label="Match activity"
            />
          </div>
          {tab === "trades" ? <TradesTableHeader /> : null}
          {tab === "trades" ? <TradesTable /> : null}
          {tab === "context" ? (
            <div className="px-4 py-4 text-sm text-prophet-muted">
              Match context uses bookmaker 1X2 odds and winner-market volume
              estimates until fixture markets are linked.
            </div>
          ) : null}
        </div>
      </div>

      <aside className="order-1 flex min-w-0 flex-col gap-4 xl:order-2 xl:sticky xl:top-14">
        <GameTradeWidget snapshot={snapshot} teamSnapshots={teamSnapshots} />
        <MatchTeamLinks match={snapshot.match} snapshots={teamSnapshots} />
        <RelatedMatchGames
          currentMatchId={snapshot.match.id}
          matches={relatedMatches}
          snapshots={teamSnapshots}
        />
      </aside>
    </div>
  );

  if (embedded) {
    return content;
  }

  return <div className={tradePageClass}>{content}</div>;
}

export { TradeGameSimpleView } from "@/views/trade/game/simple";
