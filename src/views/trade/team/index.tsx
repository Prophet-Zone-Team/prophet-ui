"use client";

import { useMemo } from "react";

import { SyncMatchLiveStore } from "@/components/match/sync-match-live-store";
import { MarketWsProvider } from "@/context/market-ws";
import {
  useSetShowOrderbook,
  useShowOrderbook
} from "@/store/user-config-store";
import type {
  ApiFootballTeamProfile,
  TeamFootballMetadata,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import { ActivityTabs } from "@/views/trade/team/activity-tabs";
import { TradeHeader } from "@/views/trade/team/trade-header";
import { useTeamMarketWsTokens } from "@/views/trade/team/use-team-market-ws-tokens";
import { ProbabilitySection } from "@/views/trade/team-probability";
import { RelatedGames } from "@/views/trade/related-games";
import { TradeWidget } from "@/views/trade/trade-widget";
import { tradePageClass } from "@/views/trade/trade-widget/trade-ui";

export interface TradeTeamViewProps {
  snapshot: TeamMarketSnapshot;
  footballProfile?: ApiFootballTeamProfile;
  footballMetadata?: TeamFootballMetadata;
}

function TradeTeamViewContent({
  snapshot,
  footballProfile,
  footballMetadata
}: TradeTeamViewProps) {
  const showOrderbook = useShowOrderbook();
  const setShowOrderbook = useSetShowOrderbook();
  const allSnapshots = useMemo(() => [snapshot], [snapshot]);
  const matches = useMemo<WorldCupMatch[]>(() => [], []);

  useTeamMarketWsTokens(
    snapshot,
    Boolean(
      snapshot.market.polymarket?.tokens.yes?.tokenId ||
      snapshot.market.polymarket?.tokens.no?.tokenId
    )
  );

  return (
    <div className={tradePageClass}>
      <SyncMatchLiveStore matches={matches} />
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

export default function TradeTeamView({
  snapshot,
  footballProfile,
  footballMetadata
}: TradeTeamViewProps) {
  const yesTokenId = snapshot.market.polymarket?.tokens.yes?.tokenId;
  const noTokenId = snapshot.market.polymarket?.tokens.no?.tokenId;
  const marketWsEnabled = Boolean(yesTokenId || noTokenId);

  return (
    <MarketWsProvider enabled={marketWsEnabled}>
      <TradeTeamViewContent
        snapshot={snapshot}
        footballProfile={footballProfile}
        footballMetadata={footballMetadata}
      />
    </MarketWsProvider>
  );
}

/** @deprecated Use TradeTeamViewProps */
export type TradeViewProps = TradeTeamViewProps;
