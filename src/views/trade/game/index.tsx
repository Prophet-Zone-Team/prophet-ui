"use client";

import { useMemo } from "react";

import { SyncMatchLiveStore } from "@/components/match/sync-match-live-store";
import { MarketWsProvider } from "@/context/market-ws";
import { isMockLiveFixtureEnabled } from "@/data/mock/live-fixture-simulation";
import {
  TradeGameHeader,
  type TradeGameHeaderProps
} from "@/views/trade/game/header";
import { TradeGameHeaderToolbar } from "@/views/trade/game/header-toolbar";
import { GameMarketsSection } from "@/views/trade/game/markets";
import { RelatedGames } from "@/views/trade/related-games";
import { gameContentClass } from "@/views/trade/game/ui";
import { TradeWidget } from "@/views/trade/trade-widget";
import type {
  ApiFootballTeamProfile,
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  WorldCupMatch
} from "@/types/market";

export type TradeGameViewProps = TradeGameHeaderProps & {
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
  relatedMatches: WorldCupMatch[];
  teamProfiles?: Partial<Record<string, ApiFootballTeamProfile>>;
};

export default function TradeGameView({
  match,
  snapshots,
  gameSnapshot,
  fixtureMarkets,
  relatedMatches,
  teamProfiles
}: TradeGameViewProps) {
  const marketWsEnabled = !isMockLiveFixtureEnabled();

  const sidebar = useMemo(() => {
    const focalTeamId =
      match.homeTeamId ?? gameSnapshot.homeTeamId ?? snapshots[0]?.team.id;

    if (!focalTeamId) {
      return {
        relatedGames: {
          teamId: snapshots[0]?.team.id ?? "",
          matches: relatedMatches,
          snapshots
        }
      };
    }

    return {
      relatedGames: {
        teamId: focalTeamId,
        matches: relatedMatches,
        snapshots
      }
    };
  }, [gameSnapshot.homeTeamId, match.homeTeamId, relatedMatches, snapshots]);

  const matchesToSync = useMemo(
    () => [match, ...relatedMatches],
    [match, relatedMatches]
  );

  return (
    <MarketWsProvider enabled={marketWsEnabled}>
      <SyncMatchLiveStore matches={matchesToSync} />
      <div className="relative left-1/2 pt-6 min-h-[calc(100vh-2.75rem)] w-screen max-w-[100vw] -translate-x-1/2">
        <div className="bg-black h-[258px] w-full absolute top-0 left-0" />
        <TradeGameHeaderToolbar />
        <div className={`${gameContentClass} pb-10 relative z-10`}>
          <div className="shrink-0 w-[1080px] pt-2">
            <div className="relative">
              <TradeGameHeader
                match={match}
                snapshots={snapshots}
                teamProfiles={teamProfiles}
              />
            </div>
            <GameMarketsSection
              match={match}
              gameSnapshot={gameSnapshot}
              fixtureMarkets={fixtureMarkets}
              teamSnapshots={snapshots}
            />
          </div>
          <div className="mt-6 flex flex-col gap-4 w-[345px]">
            <TradeWidget
              variant="game"
              gameSnapshot={gameSnapshot}
              teamSnapshots={snapshots}
            />
            {sidebar.relatedGames.teamId ? (
              <RelatedGames {...sidebar.relatedGames} />
            ) : null}
          </div>
        </div>
      </div>
    </MarketWsProvider>
  );
}
