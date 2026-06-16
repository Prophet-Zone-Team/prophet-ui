"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { SyncMatchLiveStore } from "@/components/match/sync-match-live-store";
import { MarketWsProvider } from "@/context/market-ws";
import {
  TradeGameHeader,
  type TradeGameHeaderProps
} from "@/views/trade/game/header";
import { TradeGameHeaderToolbar } from "@/views/trade/game/header-toolbar";
import { GameMarketsSection } from "@/views/trade/game/markets";
import type { GameMarketTabId } from "@/views/trade/game/markets/fixture-market-actions";
import { useRelatedGames } from "@/hooks/market/use-related-games";
import { buildRelatedGamesTeamsQuery } from "@/lib/market/related-games-query";
import { RelatedGames } from "@/views/trade/related-games";
import { gameContentClass } from "@/views/trade/game/ui";
import { useGameTradingMetadata } from "@/views/trade/game/use-game-trading-metadata";
import { isGameMarketLiveUpdatesEnabled } from "@/lib/market/live-match";
import { isGameClosedForTrading } from "@/lib/market/trading-market-status";
import { useFormatOutcomeButtonDisplay } from "@/hooks/market/use-format-outcome-button-display";
import { useMatchWithLiveState } from "@/store/match-live-store";
import { TradeWidget } from "@/views/trade/trade-widget";
import { useGameMobileOutcomePrices } from "./use-game-mobile-outcome-prices";
import type { ProphetGameSiblingEventSlugs } from "@/types/prophet-api";
import type {
  ApiFootballTeamProfile,
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot
} from "@/types/market";
import Drawer from "@/components/drawer";
import {
  useSetTradeOrderMode,
  useSetTradeOutcomeSide,
  useSetTradeTab,
  useTradeOutcomeSide
} from "@/store";
import Bg from "@/views/trade/game/header/bg";

export type TradeGameViewProps = TradeGameHeaderProps & {
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
  siblingEventSlugs: ProphetGameSiblingEventSlugs;
  tracked?: boolean;
  teamProfiles?: Partial<Record<string, ApiFootballTeamProfile>>;
};

export default function TradeGameView({
  match: initialMatch,
  snapshots,
  gameSnapshot: initialGameSnapshot,
  fixtureMarkets: initialFixtureMarkets,
  siblingEventSlugs,
  teamProfiles
}: TradeGameViewProps) {
  const t = useTranslations("trade");
  const [activeMarketTab, setActiveMarketTab] =
    useState<GameMarketTabId>("moneyline");

  const {
    match,
    gameSnapshot,
    fixtureMarkets,
    loadingTab,
    ensureTabTradingData,
    isTabTradingReady
  } = useGameTradingMetadata({
    initialMatch,
    initialGameSnapshot,
    initialFixtureMarkets,
    siblingEventSlugs,
    teamSnapshots: snapshots
  });

  const liveMatch = useMatchWithLiveState(match);
  const marketWsEnabled = isGameMarketLiveUpdatesEnabled(liveMatch);

  const canTrade =
    isTabTradingReady(activeMarketTab) &&
    loadingTab !== activeMarketTab &&
    !isGameClosedForTrading(liveMatch, gameSnapshot.market.closed);

  const handleMarketTabChange = (tab: GameMarketTabId) => {
    setActiveMarketTab(tab);
    void ensureTabTradingData(tab);
  };

  const relatedGameTeamNames = useMemo(
    () =>
      [match.homeDisplayName, match.awayDisplayName].filter(
        (name): name is string => Boolean(name?.trim())
      ),
    [match.awayDisplayName, match.homeDisplayName]
  );

  const relatedGamesTeamsKey = buildRelatedGamesTeamsQuery(relatedGameTeamNames);

  const { matches: relatedMatches } = useRelatedGames({
    teamNames: relatedGameTeamNames,
    excludeMatchId: match.id
  });

  const sidebar = useMemo(() => {
    const focalTeamId =
      match.homeTeamId ?? gameSnapshot.homeTeamId ?? snapshots[0]?.team.id;

    return {
      relatedGames: {
        teamNames: relatedGameTeamNames,
        highlightTeamId: focalTeamId ?? snapshots[0]?.team.id ?? "",
        excludeMatchId: match.id,
        snapshots
      }
    };
  }, [
    gameSnapshot.homeTeamId,
    match.homeTeamId,
    match.id,
    relatedGameTeamNames,
    snapshots
  ]);

  const matchesToSync = useMemo(
    () => [match, ...relatedMatches],
    [match, relatedMatches]
  );

  const setTab = useSetTradeTab();
  const setOutcomeSide = useSetTradeOutcomeSide();
  const setOrderMode = useSetTradeOrderMode();
  const outcomeSide = useTradeOutcomeSide();
  const [tradeDrawerOpen, setTradeDrawerOpen] = useState<boolean>(false);

  function openTradeDrawer(side: "yes" | "no") {
    if (!canTrade) {
      return;
    }

    setOutcomeSide(side);
    setTab("buy");
    setOrderMode("market");
    setTradeDrawerOpen(true);
  }

  const drawerTitle = outcomeSide === "yes" ? t("buyYes") : t("buyNo");
  const { yesPrice, noPrice } = useGameMobileOutcomePrices(
    gameSnapshot,
    marketWsEnabled
  );
  const formatOutcomeDisplay = useFormatOutcomeButtonDisplay();

  return (
    <MarketWsProvider enabled={marketWsEnabled}>
      <SyncMatchLiveStore matches={matchesToSync} />
      <div className="relative left-1/2 pt-6 min-h-[calc(100vh-2.75rem)] w-screen max-w-[100vw] -translate-x-1/2">
        <div className="bg-black h-[200px] md:h-[258px] w-full absolute top-0 left-0" />
        <div className="pointer-events-none absolute inset-x-0 z-0 max-w-[453px] h-[200px] md:h-[258px] overflow-visible left-1/2 -translate-x-1/2 top-[14px] md:left-[calc(50%-180px)] md:top-[19px]">
          <Bg />
        </div>
        <TradeGameHeaderToolbar />
        <div
          className={`${gameContentClass} pb-[130px] md:pb-10 relative z-10`}
        >
          <div className="shrink-0 w-full md:w-[1080px] pt-2">
            <div className="relative h-[182px] md:h-[220px]">
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
              onTabChange={handleMarketTabChange}
            />
          </div>
          <div className="mt-6 hidden min-w-0 flex-col gap-4 md:flex md:w-[345px]">
            <TradeWidget
              variant="game"
              gameSnapshot={gameSnapshot}
              fixtureMarkets={fixtureMarkets}
              teamSnapshots={snapshots}
              outcomeButtonClassName="w-full"
              outcomeButtonContainerClassName="gap-3"
            />
            {relatedGamesTeamsKey.length > 0 ? (
              <RelatedGames {...sidebar.relatedGames} />
            ) : null}
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 z-10 flex w-full items-center justify-between gap-5 p-3 md:hidden">
        <button
          type="button"
          className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF674B] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canTrade}
          onClick={() => openTradeDrawer("no")}
        >
          <span className="text-lg font-[500]">{t("no")}</span>
          <span className="text-xs font-[500] leading-[14px]">
            {formatOutcomeDisplay(noPrice)}
          </span>
        </button>
        <button
          type="button"
          className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#65AF14] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canTrade}
          onClick={() => openTradeDrawer("yes")}
        >
          <span className="text-lg font-[500]">{t("yes")}</span>
          <span className="text-xs font-[500] leading-[14px]">
            {formatOutcomeDisplay(yesPrice)}
          </span>
        </button>
      </div>
      <Drawer
        open={!!tradeDrawerOpen}
        onClose={() => setTradeDrawerOpen(false)}
        title={drawerTitle}
        className="!h-auto max-h-[70dvh]"
      >
        <TradeWidget
          variant="game"
          gameSnapshot={gameSnapshot}
          fixtureMarkets={fixtureMarkets}
          teamSnapshots={snapshots}
          outcomeButtonClassName="w-full"
          outcomeButtonContainerClassName="gap-3"
          className="border-0 rounded-none"
        />
      </Drawer>
    </MarketWsProvider>
  );
}
