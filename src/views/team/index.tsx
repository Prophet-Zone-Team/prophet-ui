"use client";

import { useMemo, useState } from "react";

import { getMarketDataSourceLabel } from "../../data/providers/source";
import type { MarketDataMeta } from "../../data/providers/types";
import type {
  ApiFootballTeamProfile,
  ProbabilityHistoryPoint,
  TeamFootballMetadata,
  TeamMarketSnapshot,
  WorldCupMatch
} from "../../types/market";
import { TeamActivityTabs } from "./TeamActivityTabs";
import { TeamDetailHeader } from "./TeamDetailHeader";
import { TeamProbabilitySection } from "./TeamProbabilitySection";
import { TeamRelatedGames } from "./TeamRelatedGames";
import { TeamTradeWidget } from "./TeamTradeWidget";
import { teamDetailPageClass } from "./teamDetailUi";

export interface TeamDetailViewProps {
  snapshot: TeamMarketSnapshot;
  probabilityHistory: ProbabilityHistoryPoint[];
  matches: WorldCupMatch[];
  snapshots: TeamMarketSnapshot[];
  footballProfile?: ApiFootballTeamProfile;
  footballMetadata?: TeamFootballMetadata;
  dataStatus: MarketDataMeta;
}

export function TeamDetailView({
  snapshot,
  probabilityHistory,
  matches,
  snapshots,
  footballProfile,
  footballMetadata,
  dataStatus
}: TeamDetailViewProps) {
  const [showOrderbook, setShowOrderbook] = useState(true);
  const allSnapshots = useMemo(() => {
    const byId = new Map(snapshots.map((item) => [item.team.id, item]));
    byId.set(snapshot.team.id, snapshot);
    return [...byId.values()];
  }, [snapshot, snapshots]);

  return (
    <div className={teamDetailPageClass}>
      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_345px] xl:items-start">
        <div className="order-2 flex min-w-0 flex-col gap-4 xl:order-1">
          <TeamDetailHeader
            snapshot={snapshot}
            profile={footballProfile}
            metadata={footballMetadata}
            showOrderbook={showOrderbook}
            onOrderbookChange={setShowOrderbook}
          />
          <TeamProbabilitySection
            snapshot={snapshot}
            probabilityHistory={probabilityHistory}
            matches={matches}
            snapshots={allSnapshots}
            showOrderbook={showOrderbook}
          />
          <TeamActivityTabs snapshot={snapshot} />
        </div>

        <aside className="order-1 flex min-w-0 flex-col gap-4 xl:order-2 xl:sticky xl:top-14">
          <TeamTradeWidget snapshot={snapshot} />
          <TeamRelatedGames
            teamId={snapshot.team.id}
            matches={matches}
            snapshots={allSnapshots}
          />
        </aside>
      </div>
    </div>
  );
}
