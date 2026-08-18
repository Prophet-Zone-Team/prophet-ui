"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import Drawer from "@/components/drawer";
import { resolveAllFixtureOutcomes } from "@/lib/market/fixture-tab-outcomes";
import {
  resolveLineOutcomeForSide,
  resolveLineOutcomePair,
  resolveLineOutcomeTradeBinarySide
} from "@/lib/market/fixture-line-outcome-pair";
import { isGameMarketWsEnabled } from "@/lib/market/live-match";
import { isGameClosedForTrading } from "@/lib/market/trading-market-status";
import {
  useSelectFixtureOutcome,
  useSetTradeOrderMode,
  useSetTradeOutcomeSide,
  useSetTradeTab,
  useSelectedFixtureOutcome,
  useTradeOutcomeSide
} from "@/store/trade-ticket-store";
import type {
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  OrderOutcomeSide,
  WorldCupMatch
} from "@/types/market";
import { useFormatOutcomeButtonDisplay } from "@/hooks/market/use-format-outcome-button-display";
import { useGameMarketWsTokens } from "@/views/trade/game/markets/use-game-market-ws-tokens";
import { useGameMobileOutcomePrices } from "@/views/trade/game/use-game-mobile-outcome-prices";
import { TradeWidget } from "@/views/trade/trade-widget";

export interface MarketsTradePanelProps {
  match: WorldCupMatch;
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
}

export function MarketsTradePanel({
  match,
  gameSnapshot,
  fixtureMarkets
}: MarketsTradePanelProps) {
  const marketWsEnabled = isGameMarketWsEnabled(match);
  const fixtureOutcomes = useMemo(
    () => resolveAllFixtureOutcomes(fixtureMarkets),
    [fixtureMarkets]
  );

  useGameMarketWsTokens({
    fixtureOutcomes,
    gameSnapshot,
    enabled: marketWsEnabled
  });

  return (
    <TradeWidget
      variant="game"
      gameSnapshot={gameSnapshot}
      fixtureMarkets={fixtureMarkets}
      teamSnapshots={[]}
      outcomeButtonClassName="w-full"
      outcomeButtonContainerClassName="gap-3"
    />
  );
}

export function MarketsTradeMobileControls({
  match,
  gameSnapshot,
  fixtureMarkets
}: MarketsTradePanelProps) {
  const t = useTranslations("trade");
  const [tradeDrawerOpen, setTradeDrawerOpen] = useState(false);
  const outcomeSide = useTradeOutcomeSide();
  const selectedFixtureOutcome = useSelectedFixtureOutcome();
  const setOutcomeSide = useSetTradeOutcomeSide();
  const setTab = useSetTradeTab();
  const setOrderMode = useSetTradeOrderMode();
  const selectFixtureOutcome = useSelectFixtureOutcome();
  const formatOutcomeDisplay = useFormatOutcomeButtonDisplay();

  const marketWsEnabled = isGameMarketWsEnabled(match);
  const fixtureOutcomes = useMemo(
    () => resolveAllFixtureOutcomes(fixtureMarkets),
    [fixtureMarkets]
  );

  useGameMarketWsTokens({
    fixtureOutcomes,
    gameSnapshot,
    enabled: marketWsEnabled
  });

  const { yesPrice, noPrice, yesLabel, noLabel, selectedOutcomeLabel } =
    useGameMobileOutcomePrices(gameSnapshot, fixtureMarkets, marketWsEnabled);

  const canTrade = !isGameClosedForTrading(match, gameSnapshot.market.closed);
  const lineOutcomePair = selectedFixtureOutcome
    ? resolveLineOutcomePair(selectedFixtureOutcome, fixtureMarkets)
    : undefined;

  const openTradeDrawer = useCallback(
    (side: OrderOutcomeSide) => {
      if (!canTrade) {
        return;
      }

      if (lineOutcomePair) {
        const targetOutcome = resolveLineOutcomeForSide(lineOutcomePair, side);
        selectFixtureOutcome(
          targetOutcome,
          resolveLineOutcomeTradeBinarySide(targetOutcome)
        );
      } else {
        setOutcomeSide(side);
      }

      setTab("buy");
      setOrderMode("market");
      setTradeDrawerOpen(true);
    },
    [
      canTrade,
      lineOutcomePair,
      selectFixtureOutcome,
      setOrderMode,
      setOutcomeSide,
      setTab
    ]
  );

  const drawerTitle = lineOutcomePair
    ? selectedOutcomeLabel ?? (outcomeSide === "yes" ? t("buyYes") : t("buyNo"))
    : outcomeSide === "yes"
      ? t("buyYes")
      : t("buyNo");

  return (
    <>
      <div className="fixed bottom-0 left-0 z-10 flex w-full items-center justify-between gap-5 p-3 md:hidden">
        <button
          type="button"
          className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF674B] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canTrade}
          onClick={() => openTradeDrawer("no")}
        >
          <span className="text-lg font-[500]">{noLabel ?? t("no")}</span>
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
          <span className="text-lg font-[500]">{yesLabel ?? t("yes")}</span>
          <span className="text-xs font-[500] leading-[14px]">
            {formatOutcomeDisplay(yesPrice)}
          </span>
        </button>
      </div>

      <Drawer
        open={tradeDrawerOpen}
        onClose={() => setTradeDrawerOpen(false)}
        title={drawerTitle}
        className="!h-auto max-h-[70dvh] md:hidden"
      >
        <TradeWidget
          variant="game"
          gameSnapshot={gameSnapshot}
          fixtureMarkets={fixtureMarkets}
          teamSnapshots={[]}
          outcomeButtonClassName="w-full"
          outcomeButtonContainerClassName="gap-3"
          className="border-0 rounded-none"
        />
      </Drawer>
    </>
  );
}
