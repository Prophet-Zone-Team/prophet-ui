"use client";

import { useMemo, useState } from "react";

import type { MarketDataMeta } from "../../data/providers/types";
import type {
  ApiFootballTeamProfile,
  ProbabilityHistoryPoint,
  TeamFootballMetadata,
  TeamMarketSnapshot,
  WorldCupMatch
} from "../../types/market";
import { ActivityTabs } from "./activity-tabs";
import { TradeHeader } from "./trade-header";
import { ProbabilitySection } from "./probability-section";
import { RelatedGames } from "./related-games";
import { TradeWidget } from "./trade-widget";
import { tradePageClass } from "./trade-widget/trade-ui";

export interface TradeTeamProViewProps {
  snapshot: TeamMarketSnapshot;
  probabilityHistory: ProbabilityHistoryPoint[];
  matches: WorldCupMatch[];
  snapshots: TeamMarketSnapshot[];
  footballProfile?: ApiFootballTeamProfile;
  footballMetadata?: TeamFootballMetadata;
  dataStatus: MarketDataMeta;
}

export function TradeTeamProView({
  snapshot,
  probabilityHistory,
  matches,
  snapshots,
  footballProfile,
  footballMetadata
}: TradeTeamProViewProps) {
  const [showOrderbook, setShowOrderbook] = useState(true);
  const allSnapshots = useMemo(() => {
    const byId = new Map(snapshots.map((item) => [item.team.id, item]));
    byId.set(snapshot.team.id, snapshot);
    return [...byId.values()];
  }, [snapshot, snapshots]);

  return (
    <div className={tradePageClass}>
      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_345px] xl:items-start">
        <div className="order-2 flex min-w-0 flex-col gap-4 xl:order-1">
          <TradeHeader
            snapshot={snapshot}
            profile={footballProfile}
            metadata={footballMetadata}
            showOrderbook={showOrderbook}
            onOrderbookChange={setShowOrderbook}
          />
          <ProbabilitySection
            snapshot={snapshot}
            probabilityHistory={probabilityHistory}
            matches={matches}
            snapshots={allSnapshots}
            showOrderbook={showOrderbook}
          />
          <ActivityTabs snapshot={snapshot} />
        </div>

        <aside className="order-1 flex min-w-0 flex-col gap-4 xl:order-2 xl:sticky xl:top-14">
          <TradeWidget snapshot={snapshot} />
          <RelatedGames
            teamId={snapshot.team.id}
            matches={matches}
            snapshots={allSnapshots}
          />
        </aside>
      </div>
    </div>
  );
}

/** @deprecated Use TradeTeamProView */
export const TradeView = TradeTeamProView;
export type TradeViewProps = TradeTeamProViewProps;
