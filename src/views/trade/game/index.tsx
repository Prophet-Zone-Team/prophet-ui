"use client";

import { useMemo } from "react";

import {
  TradeGameHeader,
  type TradeGameHeaderProps
} from "@/views/trade/game/header";
import { TradeGameHeaderToolbar } from "@/views/trade/game/header-toolbar";
import { GameProbabilitySection } from "@/views/trade/game-probability";
import { RelatedGames } from "@/views/trade/related-games";
import { TradeGameMarketSection } from "@/views/trade/game/market-section";
import { gameContentClass } from "@/views/trade/game/ui";
import { TradeWidget } from "@/views/trade/trade-widget";
import type {
  ApiFootballTeamProfile,
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import { GameFixtureMarketsSection } from "@/views/trade/game/fixture-markets";

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

  return (
    <div className="relative left-1/2 pt-6 min-h-[calc(100vh-2.75rem)] w-screen max-w-[100vw] -translate-x-1/2 bg-white">
      <div className="bg-black h-[258px] w-full absolute top-0 left-0" />
      <TradeGameHeaderToolbar />
      <div className={`${gameContentClass} pb-10 relative z-10`}>
        <div className="shrink-0 w-[1000px] pt-2">
          <div className="relative">
            <TradeGameHeader
              match={match}
              snapshots={snapshots}
              teamProfiles={teamProfiles}
            />
          </div>
          <TradeGameMarketSection
            gameSnapshot={gameSnapshot}
            teamSnapshots={snapshots}
          />
          <GameProbabilitySection
            match={match}
            snapshots={snapshots}
            gameSnapshot={gameSnapshot}
          />
          <GameFixtureMarketsSection
            fixtureMarkets={fixtureMarkets}
            gameSnapshot={gameSnapshot}
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
  );
}
