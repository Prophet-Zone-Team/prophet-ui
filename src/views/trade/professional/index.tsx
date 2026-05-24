"use client";

import { useMemo, useState } from "react";

import type { MarketDataMeta } from "@/data/providers/types";
import type {
  ApiFootballTeamProfile,
  GameMarketSnapshot,
  ProbabilityHistoryPoint,
  TeamFootballMetadata,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import { ActivityTabs } from "@/views/trade/professional/activity-tabs";
import { TradeHeader } from "@/views/trade/professional/trade-header";
import { GameOutcomeBidButtons } from "@/views/trade/shared/game-outcome-bid-buttons";
import { GameProbabilitySection } from "@/views/trade/game-probability";
import { ProbabilitySection } from "@/views/trade/team-probability";
import { RelatedGames } from "@/views/trade/related-games";
import { TradeWidget } from "@/views/trade/trade-widget";
import { tradePageClass } from "@/views/trade/trade-widget/trade-ui";

export interface TradeTeamProViewProps {
  variant?: "team";
  snapshot: TeamMarketSnapshot;
  probabilityHistory: ProbabilityHistoryPoint[];
  matches: WorldCupMatch[];
  snapshots: TeamMarketSnapshot[];
  footballProfile?: ApiFootballTeamProfile;
  footballMetadata?: TeamFootballMetadata;
  dataStatus: MarketDataMeta;
}

export interface TradeGameProViewProps {
  variant: "game";
  match: WorldCupMatch;
  gameSnapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
  relatedMatches: WorldCupMatch[];
  teamProfiles?: Partial<Record<string, ApiFootballTeamProfile>>;
  dataStatus: MarketDataMeta;
}

export type TradeProViewProps = TradeTeamProViewProps | TradeGameProViewProps;

function isGameProps(props: TradeProViewProps): props is TradeGameProViewProps {
  return props.variant === "game";
}

function TradeTeamProView({
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

function TradeGameProView({
  match,
  gameSnapshot,
  teamSnapshots,
  relatedMatches,
  teamProfiles
}: TradeGameProViewProps) {
  const [showOrderbook, setShowOrderbook] = useState(true);

  const relatedGamesTeamId = useMemo(() => {
    return (
      match.homeTeamId ??
      gameSnapshot.homeTeamId ??
      teamSnapshots[0]?.team.id ??
      ""
    );
  }, [gameSnapshot.homeTeamId, match.homeTeamId, teamSnapshots]);

  return (
    <div className={tradePageClass}>
      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_345px] xl:items-start">
        <div className="order-2 flex min-w-0 flex-col gap-4 xl:order-1">
          <TradeHeader
            variant="game"
            match={match}
            teamSnapshots={teamSnapshots}
            teamProfiles={teamProfiles}
            showOrderbook={showOrderbook}
            onOrderbookChange={setShowOrderbook}
          />
          <GameProbabilitySection
            match={match}
            snapshots={teamSnapshots}
            gameSnapshot={gameSnapshot}
            showOrderbook={showOrderbook}
          />
          <ActivityTabs
            variant="game"
            gameSnapshot={gameSnapshot}
            teamSnapshots={teamSnapshots}
          />
        </div>

        <aside className="order-1 flex min-w-0 flex-col gap-4 xl:order-2 xl:sticky xl:top-14">
          <GameOutcomeBidButtons
            gameSnapshot={gameSnapshot}
            teamSnapshots={teamSnapshots}
          />
          <TradeWidget
            variant="game"
            gameSnapshot={gameSnapshot}
            teamSnapshots={teamSnapshots}
          />
          {relatedGamesTeamId ? (
            <RelatedGames
              teamId={relatedGamesTeamId}
              matches={relatedMatches}
              snapshots={teamSnapshots}
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}

export default function ProfessionalPage(props: TradeProViewProps) {
  if (isGameProps(props)) {
    return <TradeGameProView {...props} />;
  }

  return <TradeTeamProView {...props} />;
}

/** @deprecated Use TradeTeamProViewProps */
export type TradeViewProps = TradeTeamProViewProps;
