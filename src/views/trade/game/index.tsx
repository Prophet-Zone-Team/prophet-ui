"use client";

import { useMemo, useState } from "react";

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
import Drawer from "@/components/drawer";
import { useTradeTab, useTradeTicketStore } from "@/store";

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

  const setTab = useTradeTicketStore((state) => state.setTab);
  const tab = useTradeTab();
  const [tradeDrawerOpen, setTradeDrawerOpen] = useState<boolean>(false);

  return (
    <MarketWsProvider enabled={marketWsEnabled}>
      <SyncMatchLiveStore matches={matchesToSync} />
      <div className="relative left-1/2 pt-6 min-h-[calc(100vh-2.75rem)] w-screen max-w-[100vw] -translate-x-1/2">
        <div className="bg-black h-[228px] md:h-[258px] w-full absolute top-0 left-0" />
        <TradeGameHeaderToolbar />
        <div className={`${gameContentClass} pb-[110px] md:pb-10 relative z-10`}>
          <div className="shrink-0 w-full md:w-[1080px] pt-2">
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
          <div className="mt-6 flex flex-col gap-4 w-full md:w-[345px]">
            <TradeWidget
              variant="game"
              gameSnapshot={gameSnapshot}
              teamSnapshots={snapshots}
              className="hidden md:flex"
            />
            {sidebar.relatedGames.teamId ? (
              <RelatedGames {...sidebar.relatedGames} />
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex md:hidden px-3 pb-10 pt-5 border border-[#EBEBEB] rounded-t-xl w-full fixed left-0 bottom-0 z-10 bg-white justify-between items-center gap-5">
        <button
          type="button"
          className="flex flex-1 h-[46px] justify-center items-center rounded-xl text-lg font-[500] text-white transition-opacity bg-[#65AF14] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            setTradeDrawerOpen(true);
            setTab("sell");
          }}
        >
          Sell
        </button>
        <button
          type="button"
          className="flex flex-1 h-[46px] justify-center items-center rounded-xl text-lg font-[500] text-white transition-opacity bg-[#65AF14] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            setTradeDrawerOpen(true);
            setTab("buy");
          }}
        >
          Buy
        </button>
      </div>
      <Drawer
        open={!!tradeDrawerOpen}
        onClose={() => setTradeDrawerOpen(false)}
        title={tab === "sell" ? "Sell" : "Buy"}
      >
        <TradeWidget
          variant="game"
          gameSnapshot={gameSnapshot}
          teamSnapshots={snapshots}
          className=""
        />
      </Drawer>
    </MarketWsProvider>
  );
}
