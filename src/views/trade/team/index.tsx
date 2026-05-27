"use client";

import { useMemo } from "react";

import type { MarketDataMeta } from "@/data/providers/types";
import {
  useSetShowOrderbook,
  useShowOrderbook
} from "@/store/user-config-store";
import type {
  ApiFootballTeamProfile,
  ProbabilityHistoryPoint,
  TeamFootballMetadata,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import { ActivityTabs } from "@/views/trade/team/activity-tabs";
import { TradeHeader } from "@/views/trade/team/trade-header";
import { ProbabilitySection } from "@/views/trade/team-probability";
import { RelatedGames } from "@/views/trade/related-games";
import { TradeWidget } from "@/views/trade/trade-widget";
import { tradePageClass } from "@/views/trade/trade-widget/trade-ui";

export interface TradeTeamViewProps {
  snapshot: TeamMarketSnapshot;
  probabilityHistory: ProbabilityHistoryPoint[];
  matches: WorldCupMatch[];
  snapshots: TeamMarketSnapshot[];
  footballProfile?: ApiFootballTeamProfile;
  footballMetadata?: TeamFootballMetadata;
  dataStatus: MarketDataMeta;
}

export default function TradeTeamView({
  snapshot,
  probabilityHistory,
  matches,
  snapshots,
  footballProfile,
  footballMetadata
}: TradeTeamViewProps) {
  const showOrderbook = useShowOrderbook();
  const setShowOrderbook = useSetShowOrderbook();
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

/** @deprecated Use TradeTeamViewProps */
export type TradeViewProps = TradeTeamViewProps;
