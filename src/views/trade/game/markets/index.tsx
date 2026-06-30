"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { trackWinnerChartTeamSelected } from "@/lib/analytics/tracking";
import { GameMarketTabSwitcher } from "@/views/trade/game/markets/game-market-tab-switcher";
import { OrderbookToggle } from "@/components/ui/orderbook-toggle";
import {
  findFixtureMarketOutcome,
  resolveDefaultFixtureOutcome,
} from "@/lib/market/fixture-markets-mapper";
import {
  getFixtureOutcomesForGroup,
  sortFixtureGroupOutcomes
} from "@/lib/market/build-fixture-markets-snapshot";
import { useGameStatisticsNotificationSync } from "@/hooks/market/use-game-statistics-notification-sync";
import { useGameOdds } from "@/hooks/market/use-game-odds";
import { mapGameOddsToOtherSources } from "@/lib/market/map-game-odds-other-sources";
import { isGameMarketWsEnabled } from "@/lib/market/live-match";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import { useMatchWithLiveState } from "@/store/match-live-store";
import {
  mergeLivePricesIntoFixtureOutcomes,
  mergeLivePricesIntoGameOutcomes,
} from "@/lib/market/merge-live-outcome-prices";
import { resolveAllFixtureOutcomes, resolveFixtureOutcomesForTab } from "@/lib/market/fixture-tab-outcomes";
import {
  useSelectFixtureOutcome,
  useSelectedFixtureOutcome,
  useTradeOutcomeSide
} from "@/store/trade-ticket-store";
import {
  useSetShowOrderbook,
  useShowOrderbook
} from "@/store/user-config-store";
import type {
  FixtureMarketOutcome,
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import { ExactScorePanel } from "@/views/trade/game/fixture-markets/exact-score-panel";
import { ExactScoreOutcomeChart } from "@/views/trade/game/fixture-markets/exact-score-outcome-chart";
import {
  buildBinarySummaryFromOutcomes,
  buildTernarySummaryFromOutcomes,
  GameProbabilitySection
} from "@/views/trade/game-probability/section";
import {
  findFixtureGroupByType,
  outcomeBelongsToTab,
  resolveDefaultLineKey,
  resolveDefaultOutcomeForTab,
  resolveTabChartKind,
  type GameMarketTabId
} from "@/views/trade/game/markets/fixture-market-actions";
import {
  HalftimeActionRow,
  LineGroupActionRow,
  MoneylineActionRow,
  resolveLineGroupForTab
} from "@/views/trade/game/markets/market-action-row";
import { GAME_MARKET_TAB_ICONS } from "@/views/trade/game/icons";
import { MarketContextRow } from "@/views/trade/game/markets/market-context-row";
import { GameStatsSection } from "@/views/trade/game/stats";
import { useGameMarketWsTokens } from "@/views/trade/game/markets/use-game-market-ws-tokens";
import { useLiveFixtureTabPrices } from "@/views/trade/game/markets/use-live-fixture-tab-prices";

const GAME_MARKET_TABS = [
  {
    id: "moneyline",
    labelKey: "moneyline",
    iconSrc: GAME_MARKET_TAB_ICONS.moneyline
  },
  {
    id: "totals",
    labelKey: "totals",
    iconSrc: GAME_MARKET_TAB_ICONS.totals
  },
  {
    id: "spreads",
    labelKey: "spreads",
    iconSrc: GAME_MARKET_TAB_ICONS.spreads
  },
  {
    id: "halftime",
    labelKey: "halftimeResults",
    iconSrc: GAME_MARKET_TAB_ICONS.halftime
  },
  {
    id: "top_scores",
    labelKey: "topScores",
    iconSrc: GAME_MARKET_TAB_ICONS.top_scores
  },
  {
    id: "stats",
    labelKey: "stats",
    iconSrc: GAME_MARKET_TAB_ICONS.stats
  }
] as const satisfies ReadonlyArray<{
  id: GameMarketTabId;
  labelKey: string;
  iconSrc: string;
}>;

export interface GameMarketsSectionProps {
  match: WorldCupMatch;
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
  onTabChange?: (tab: GameMarketTabId) => void;
}

export function GameMarketsSection({
  match,
  gameSnapshot,
  fixtureMarkets,
  teamSnapshots,
  onTabChange
}: GameMarketsSectionProps) {
  const t = useTranslations("trade");
  const [tab, setTab] = useState<GameMarketTabId>("moneyline");
  const [totalsLineKey, setTotalsLineKey] = useState<string | undefined>(() =>
    resolveDefaultLineKey(findFixtureGroupByType(fixtureMarkets.lines, "total"))
  );
  const [spreadsLineKey, setSpreadsLineKey] = useState<string | undefined>(() =>
    resolveDefaultLineKey(
      findFixtureGroupByType(fixtureMarkets.lines, "spread")
    )
  );

  const selectedOutcome = useSelectedFixtureOutcome();
  const selectedBinarySide = useTradeOutcomeSide();
  const selectFixtureOutcome = useSelectFixtureOutcome();
  const showOrderbook = useShowOrderbook();
  const setShowOrderbook = useSetShowOrderbook();
  const liveMatch = useMatchWithLiveState(match);
  const marketWsEnabled = isGameMarketWsEnabled(liveMatch);
  const sides = resolveMatchSides(liveMatch, teamSnapshots);
  const { odds: gameOdds, variant: gameVariant } = useGameOdds({
    match: liveMatch
  });
  const isGameOngoing = gameVariant === "ongoing";

  const otherSources = useMemo(
    () => {
      if (isGameOngoing) {
        return [];
      }

      return mapGameOddsToOtherSources({
        odds: gameOdds,
        tab,
        selectedOutcome: selectedOutcome ?? undefined,
        selectedBinarySide,
        homeTeamName: sides.home.name,
        awayTeamName: sides.away.name
      });
    },
    [
      gameOdds,
      isGameOngoing,
      selectedBinarySide,
      selectedOutcome,
      sides.away.name,
      sides.home.name,
      tab
    ]
  );

  const resolveExactScoreOtherSources = useCallback(
    (outcome: FixtureMarketOutcome, binarySide: "yes" | "no") =>
      isGameOngoing
        ? []
        : mapGameOddsToOtherSources({
            odds: gameOdds,
            tab: "top_scores",
            selectedOutcome: outcome,
            selectedBinarySide: binarySide,
            homeTeamName: sides.home.name,
            awayTeamName: sides.away.name
          }),
    [gameOdds, isGameOngoing, sides.away.name, sides.home.name]
  );

  useGameStatisticsNotificationSync({
    match: liveMatch,
    homeTeamName: sides.home.name,
    awayTeamName: sides.away.name,
  });

  const activeLineKey = tab === "totals" ? totalsLineKey : spreadsLineKey;
  const chartKind = resolveTabChartKind(tab);
  const activeTabOutcomes = useMemo(
    () => resolveFixtureOutcomesForTab(fixtureMarkets, tab, activeLineKey),
    [activeLineKey, fixtureMarkets, tab],
  );
  const allFixtureOutcomes = useMemo(
    () => resolveAllFixtureOutcomes(fixtureMarkets),
    [fixtureMarkets],
  );

  useGameMarketWsTokens({
    fixtureOutcomes: allFixtureOutcomes,
    gameSnapshot,
    enabled: marketWsEnabled,
  });

  const { pricesByOutcomeId, revision: marketWsRevision } = useLiveFixtureTabPrices({
    outcomes: allFixtureOutcomes,
    enabled: marketWsEnabled,
  });

  const selectDefaultForTab = useCallback(
    (nextTab: GameMarketTabId, lineKey?: string) => {
      const defaultOutcome = resolveDefaultOutcomeForTab(
        fixtureMarkets,
        nextTab,
        lineKey
      );

      if (defaultOutcome) {
        selectFixtureOutcome(defaultOutcome, "yes");
      }
    },
    [fixtureMarkets, selectFixtureOutcome]
  );

  useEffect(() => {
    if (!selectedOutcome) {
      return;
    }

    const freshOutcome = findFixtureMarketOutcome(
      {
        lines: fixtureMarkets.lines,
        exactScores: fixtureMarkets.exactScores,
        halftime: fixtureMarkets.halftime,
      },
      selectedOutcome.id
    );

    if (!freshOutcome) {
      return;
    }

    const pricingChanged =
      freshOutcome.probability !== selectedOutcome.probability ||
      freshOutcome.yesAsk !== selectedOutcome.yesAsk ||
      freshOutcome.noAsk !== selectedOutcome.noAsk ||
      freshOutcome.tokenId !== selectedOutcome.tokenId ||
      freshOutcome.noTokenId !== selectedOutcome.noTokenId;

    if (pricingChanged) {
      selectFixtureOutcome(freshOutcome, selectedBinarySide ?? "yes");
    }
  }, [
    fixtureMarkets,
    selectFixtureOutcome,
    selectedBinarySide,
    selectedOutcome,
  ]);

  useEffect(() => {
    if (selectedOutcome) {
      return;
    }

    const defaultOutcome =
      resolveDefaultFixtureOutcome(
        gameSnapshot.match.polymarket?.fixtureMarkets
      ) ??
      resolveDefaultFixtureOutcome({
        lines: fixtureMarkets.lines,
        exactScores: fixtureMarkets.exactScores,
        halftime: fixtureMarkets.halftime
      });

    if (defaultOutcome) {
      selectFixtureOutcome(defaultOutcome, "yes");
    }
  }, [
    fixtureMarkets,
    gameSnapshot.match.polymarket?.fixtureMarkets,
    selectFixtureOutcome,
    selectedOutcome
  ]);

  useEffect(() => {
    if (tab === "stats") {
      return;
    }

    if (!selectedOutcome || outcomeBelongsToTab(selectedOutcome, tab)) {
      return;
    }

    selectDefaultForTab(tab, activeLineKey);
  }, [activeLineKey, selectDefaultForTab, selectedOutcome, tab]);

  const handleTabChange = (value: string) => {
    const nextTab = value as GameMarketTabId;
    setTab(nextTab);
    onTabChange?.(nextTab);

    const nextLineKey =
      nextTab === "totals"
        ? totalsLineKey
        : nextTab === "spreads"
          ? spreadsLineKey
          : undefined;

    if (nextTab !== "stats") {
      if (!selectedOutcome || !outcomeBelongsToTab(selectedOutcome, nextTab)) {
        selectDefaultForTab(nextTab, nextLineKey);
      }
    }
  };

  const handleSelect = (
    outcome: FixtureMarketOutcome,
    binarySide: "yes" | "no" = "yes"
  ) => {
    if (
      tab === "moneyline" &&
      (outcome.side === "home" || outcome.side === "away")
    ) {
      const teamSide = outcome.side === "home" ? sides.home : sides.away;
      trackWinnerChartTeamSelected({
        chartId: "game_moneyline",
        seriesKey: outcome.side,
        teamId:
          outcome.side === "home"
            ? liveMatch.homeTeamId
            : liveMatch.awayTeamId,
        teamName: teamSide.name,
        teamCode: teamSide.code
      });
    }

    selectFixtureOutcome(outcome, binarySide);
  };

  const handleLineChange = (lineKey: string) => {
    if (tab === "totals") {
      setTotalsLineKey(lineKey);
      selectDefaultForTab("totals", lineKey);
      return;
    }

    if (tab === "spreads") {
      setSpreadsLineKey(lineKey);
      selectDefaultForTab("spreads", lineKey);
    }
  };

  const liveActiveTabOutcomes = useMemo(
    () => mergeLivePricesIntoFixtureOutcomes(activeTabOutcomes, pricesByOutcomeId),
    [activeTabOutcomes, pricesByOutcomeId, marketWsRevision],
  );
  const liveGameOutcomes = useMemo(
    () =>
      mergeLivePricesIntoGameOutcomes(
        gameSnapshot.outcomes,
        activeTabOutcomes,
        pricesByOutcomeId,
      ),
    [activeTabOutcomes, gameSnapshot.outcomes, pricesByOutcomeId, marketWsRevision],
  );
  const summaryConfig = useMemo(
    () =>
      buildSummaryConfig({
        tab,
        fixtureMarkets,
        gameSnapshot,
        totalsLineKey,
        spreadsLineKey,
        homeLabel: sides.home.name ?? t("home"),
        awayLabel: sides.away.name ?? t("away"),
        drawLabel: t("draw"),
        overLabel: t("over"),
        underLabel: t("under"),
        homeCode: sides.home.code,
        awayCode: sides.away.code,
        liveActiveTabOutcomes,
        liveGameOutcomes,
      }),
    [
      fixtureMarkets,
      gameSnapshot,
      sides.away.code,
      sides.away.name,
      sides.home.code,
      sides.home.name,
      spreadsLineKey,
      tab,
      totalsLineKey,
      liveActiveTabOutcomes,
      liveGameOutcomes,
      t,
    ]
  );

  const moneylineGroup = findFixtureGroupByType(fixtureMarkets.lines, "moneyline");
  const tabItems = useMemo(
    () =>
      GAME_MARKET_TABS.map((tabItem) => ({
        id: tabItem.id,
        label: t(tabItem.labelKey),
        iconSrc: tabItem.iconSrc
      })),
    [t]
  );

  return (
    <section
      className="md:mt-[50px] mt-[20px] flex flex-col gap-[5px]"
      aria-label={t("matchMarkets")}
    >
      <div className="flex min-w-0 items-center justify-between gap-4 px-3 md:px-0">
        <div className="min-w-0 flex-1">
          <GameMarketTabSwitcher
            items={tabItems}
            value={tab}
            onChange={handleTabChange}
            aria-label={t("matchMarketCategories")}
          />
        </div>
        <OrderbookToggle
          variant="game"
          checked={showOrderbook}
          onChange={setShowOrderbook}
          className={tab === "stats" ? "hidden" : "hidden shrink-0 md:flex"}
        />
      </div>

      {tab === "stats" ? (
        <GameStatsSection
          match={liveMatch}
          teamSnapshots={teamSnapshots}
          gameSnapshotHomeTeamId={gameSnapshot.homeTeamId}
        />
      ) : (
        <>
      {tab === "moneyline" ? (
        <MoneylineActionRow
          group={moneylineGroup}
          outcomesOverride={liveActiveTabOutcomes}
          selectedOutcomeId={selectedOutcome?.id}
          selectedBinarySide={selectedBinarySide}
          otherSources={otherSources}
          onSelect={handleSelect}
        />
      ) : null}

      {tab === "totals" ? (
        <LineGroupActionRow
          group={resolveLineGroupForTab(fixtureMarkets.lines, "totals")}
          groupType="total"
          selectedLineKey={totalsLineKey}
          onLineChange={handleLineChange}
          outcomesOverride={liveActiveTabOutcomes}
          selectedOutcomeId={selectedOutcome?.id}
          selectedBinarySide={selectedBinarySide}
          otherSources={otherSources}
          onSelect={handleSelect}
        />
      ) : null}

      {tab === "spreads" ? (
        <LineGroupActionRow
          group={resolveLineGroupForTab(fixtureMarkets.lines, "spreads")}
          groupType="spread"
          selectedLineKey={spreadsLineKey}
          onLineChange={handleLineChange}
          outcomesOverride={liveActiveTabOutcomes}
          selectedOutcomeId={selectedOutcome?.id}
          selectedBinarySide={selectedBinarySide}
          otherSources={otherSources}
          onSelect={handleSelect}
        />
      ) : null}

      {tab === "halftime" ? (
        <HalftimeActionRow
          outcomes={liveActiveTabOutcomes}
          selectedOutcomeId={selectedOutcome?.id}
          selectedBinarySide={selectedBinarySide}
          otherSources={otherSources}
          onSelect={handleSelect}
        />
      ) : null}

      {tab === "top_scores" ? (
        <ExactScorePanel
          outcomes={liveActiveTabOutcomes}
          selectedOutcomeId={selectedOutcome?.id}
          selectedBinarySide={selectedBinarySide}
          resolveOtherSources={resolveExactScoreOtherSources}
          renderExpandedChart={(outcome) => (
            <ExactScoreOutcomeChart
              match={liveMatch}
              gameSnapshot={gameSnapshot}
              fixtureMarkets={fixtureMarkets}
              teamSnapshots={teamSnapshots}
              outcome={outcome}
              showOrderbook={showOrderbook}
            />
          )}
          onSelect={handleSelect}
        />
      ) : null}

      {chartKind ? (
        <GameProbabilitySection
          match={liveMatch}
          snapshots={teamSnapshots}
          gameSnapshot={gameSnapshot}
          fixtureMarkets={fixtureMarkets}
          showOrderbook={showOrderbook}
          chartKind={chartKind}
          lineKey={
            tab === "totals"
              ? totalsLineKey
              : tab === "spreads"
                ? spreadsLineKey
                : undefined
          }
          summaryMode={summaryConfig.summaryMode}
          summaryItems={summaryConfig.summaryItems}
          binaryPrimaryLabel={summaryConfig.binaryPrimaryLabel}
          binarySecondaryLabel={summaryConfig.binarySecondaryLabel}
        />
      ) : null}

      <MarketContextRow
        match={liveMatch}
        teamSnapshots={teamSnapshots}
        gameSnapshotHomeTeamId={gameSnapshot.homeTeamId}
      />
        </>
      )}
    </section>
  );
}

function buildSummaryConfig({
  tab,
  fixtureMarkets,
  totalsLineKey,
  spreadsLineKey,
  homeLabel,
  awayLabel,
  drawLabel,
  overLabel,
  underLabel,
  homeCode,
  awayCode,
  liveActiveTabOutcomes,
  liveGameOutcomes,
}: {
  tab: GameMarketTabId;
  fixtureMarkets: GameFixtureMarketsSnapshot;
  gameSnapshot: GameMarketSnapshot;
  totalsLineKey?: string;
  spreadsLineKey?: string;
  homeLabel: string;
  awayLabel: string;
  drawLabel: string;
  overLabel: string;
  underLabel: string;
  homeCode?: string;
  awayCode?: string;
  liveActiveTabOutcomes: FixtureMarketOutcome[];
  liveGameOutcomes: ReturnType<typeof mergeLivePricesIntoGameOutcomes>;
}) {
  if (tab === "moneyline") {
    return {
      summaryMode: "ternary" as const,
      summaryItems: buildTernarySummaryFromOutcomes(
        liveGameOutcomes,
        homeLabel,
        awayLabel,
        drawLabel,
        homeCode,
        awayCode
      )
    };
  }

  if (tab === "halftime") {
    return {
      summaryMode: "ternary" as const,
      summaryItems: buildTernarySummaryFromOutcomes(
        liveActiveTabOutcomes,
        homeLabel,
        awayLabel,
        drawLabel,
        homeCode,
        awayCode
      )
    };
  }

  if (tab === "totals") {
    const outcomes = liveActiveTabOutcomes.length
      ? liveActiveTabOutcomes
      : (() => {
          const group = findFixtureGroupByType(fixtureMarkets.lines, "total");
          return group
            ? sortFixtureGroupOutcomes(
                getFixtureOutcomesForGroup(
                  group,
                  totalsLineKey ?? group.defaultLineKey
                ),
                "total"
              )
            : [];
        })();

    return {
      summaryMode: "binary" as const,
      summaryItems: buildBinarySummaryFromOutcomes(
        outcomes,
        "over",
        "under",
        overLabel,
        underLabel
      ),
      binaryPrimaryLabel: overLabel,
      binarySecondaryLabel: underLabel
    };
  }

  if (tab === "spreads") {
    const outcomes = liveActiveTabOutcomes.length
      ? liveActiveTabOutcomes
      : (() => {
          const group = findFixtureGroupByType(fixtureMarkets.lines, "spread");
          return group
            ? sortFixtureGroupOutcomes(
                getFixtureOutcomesForGroup(
                  group,
                  spreadsLineKey ?? group.defaultLineKey
                ),
                "spread"
              )
            : [];
        })();
    const homeOutcome = outcomes.find((item) => item.side === "home");
    const awayOutcome = outcomes.find((item) => item.side === "away");

    return {
      summaryMode: "binary" as const,
      summaryItems: buildBinarySummaryFromOutcomes(
        outcomes,
        "home",
        "away",
        homeOutcome?.label ?? homeLabel,
        awayOutcome?.label ?? awayLabel,
        homeCode,
        awayCode
      ),
      binaryPrimaryLabel: homeOutcome?.label ?? homeLabel,
      binarySecondaryLabel: awayOutcome?.label ?? awayLabel
    };
  }

  return {
    summaryMode: "ternary" as const,
    summaryItems: []
  };
}
