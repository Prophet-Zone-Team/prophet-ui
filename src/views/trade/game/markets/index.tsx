"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { TabSwitcher } from "@/components/ui/tab-switcher";
import { OrderbookToggle } from "@/components/ui/orderbook-toggle";
import { resolveDefaultFixtureOutcome } from "@/lib/market/fixture-markets-mapper";
import {
  getFixtureOutcomesForGroup,
  sortFixtureGroupOutcomes
} from "@/lib/market/build-fixture-markets-snapshot";
import {
  isEffectiveLiveMatch,
  isMockLiveFixtureEnabled,
} from "@/data/mock/live-fixture-simulation";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import {
  mergeLivePricesIntoFixtureOutcomes,
  mergeLivePricesIntoGameOutcomes,
} from "@/lib/market/merge-live-outcome-prices";
import { resolveFixtureOutcomesForTab } from "@/lib/market/fixture-tab-outcomes";
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
import { useLiveFixtureTabPrices } from "@/views/trade/game/markets/use-live-fixture-tab-prices";
import { useMockLiveFixtureSimulation } from "@/views/trade/game/markets/use-mock-live-fixture-simulation";

const GAME_MARKET_TABS = [
  {
    id: "moneyline",
    label: "Moneyline",
    iconSrc: GAME_MARKET_TAB_ICONS.moneyline
  },
  { id: "totals", label: "Totals", iconSrc: GAME_MARKET_TAB_ICONS.totals },
  { id: "spreads", label: "Spreads", iconSrc: GAME_MARKET_TAB_ICONS.spreads },
  {
    id: "halftime",
    label: "Halftime Results",
    iconSrc: GAME_MARKET_TAB_ICONS.halftime
  },
  {
    id: "top_scores",
    label: "Top Scores",
    iconSrc: GAME_MARKET_TAB_ICONS.top_scores
  }
] as const satisfies ReadonlyArray<{
  id: GameMarketTabId;
  label: string;
  iconSrc: string;
}>;

export interface GameMarketsSectionProps {
  match: WorldCupMatch;
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
}

export function GameMarketsSection({
  match,
  gameSnapshot,
  fixtureMarkets,
  teamSnapshots
}: GameMarketsSectionProps) {
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
  const sides = resolveMatchSides(match, teamSnapshots);
  const activeLineKey = tab === "totals" ? totalsLineKey : spreadsLineKey;
  const effectiveLive = isEffectiveLiveMatch(match);
  const chartKind = resolveTabChartKind(tab);
  const activeTabOutcomes = useMemo(
    () => resolveFixtureOutcomesForTab(fixtureMarkets, tab, activeLineKey),
    [activeLineKey, fixtureMarkets, tab],
  );
  const mockSimulation = useMockLiveFixtureSimulation({
    match,
    outcomes: activeTabOutcomes,
    enabled: isMockLiveFixtureEnabled(),
  });
  const { pricesByOutcomeId: apiPricesByOutcomeId } = useLiveFixtureTabPrices({
    outcomes: activeTabOutcomes,
    enabled: effectiveLive && !isMockLiveFixtureEnabled(),
  });
  const pricesByOutcomeId = mockSimulation.isActive
    ? mockSimulation.pricesByOutcomeId
    : apiPricesByOutcomeId;

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
    if (!selectedOutcome || outcomeBelongsToTab(selectedOutcome, tab)) {
      return;
    }

    selectDefaultForTab(tab, activeLineKey);
  }, [activeLineKey, selectDefaultForTab, selectedOutcome, tab]);

  const handleTabChange = (value: string) => {
    const nextTab = value as GameMarketTabId;
    setTab(nextTab);

    const nextLineKey =
      nextTab === "totals"
        ? totalsLineKey
        : nextTab === "spreads"
          ? spreadsLineKey
          : undefined;

    if (!selectedOutcome || !outcomeBelongsToTab(selectedOutcome, nextTab)) {
      selectDefaultForTab(nextTab, nextLineKey);
    }
  };

  const handleSelect = (
    outcome: FixtureMarketOutcome,
    binarySide: "yes" | "no" = "yes"
  ) => {
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
    [activeTabOutcomes, pricesByOutcomeId],
  );
  const liveGameOutcomes = useMemo(
    () =>
      mergeLivePricesIntoGameOutcomes(
        gameSnapshot.outcomes,
        activeTabOutcomes,
        pricesByOutcomeId,
      ),
    [activeTabOutcomes, gameSnapshot.outcomes, pricesByOutcomeId],
  );
  const summaryConfig = useMemo(
    () =>
      buildSummaryConfig({
        tab,
        fixtureMarkets,
        gameSnapshot,
        totalsLineKey,
        spreadsLineKey,
        homeLabel: sides.home.name ?? "Home",
        awayLabel: sides.away.name ?? "Away",
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
    ]
  );

  const moneylineGroup = findFixtureGroupByType(fixtureMarkets.lines, "moneyline");

  return (
    <section
      className="mt-[50px] flex flex-col gap-[5px]"
      aria-label="Match markets"
    >
      <div className="flex items-center justify-between gap-4">
        <TabSwitcher
          items={[...GAME_MARKET_TABS]}
          value={tab}
          onChange={handleTabChange}
          aria-label="Match market categories"
        />
        <OrderbookToggle
          variant="game"
          checked={showOrderbook}
          onChange={setShowOrderbook}
        />
      </div>

      {tab === "moneyline" ? (
        <MoneylineActionRow
          group={moneylineGroup}
          outcomesOverride={liveActiveTabOutcomes}
          selectedOutcomeId={selectedOutcome?.id}
          selectedBinarySide={selectedBinarySide}
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
          onSelect={handleSelect}
        />
      ) : null}

      {tab === "halftime" ? (
        <HalftimeActionRow
          outcomes={liveActiveTabOutcomes}
          selectedOutcomeId={selectedOutcome?.id}
          selectedBinarySide={selectedBinarySide}
          onSelect={handleSelect}
        />
      ) : null}

      {tab === "top_scores" ? (
        <ExactScorePanel
          outcomes={liveActiveTabOutcomes}
          selectedOutcomeId={selectedOutcome?.id}
          selectedBinarySide={selectedBinarySide}
          onSelect={handleSelect}
        />
      ) : null}

      {chartKind ? (
        <GameProbabilitySection
          match={match}
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
          liveChartSimulation={
            mockSimulation.isActive
              ? {
                  tickIndex: mockSimulation.tickIndex,
                  simulatedElapsedSeconds: mockSimulation.simulatedElapsedSeconds,
                }
              : undefined
          }
        />
      ) : null}

      <MarketContextRow defaultTeamId={match.homeTeamId} />
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
        "Over",
        "Under"
      ),
      binaryPrimaryLabel: "Over",
      binarySecondaryLabel: "Under"
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
        awayOutcome?.label ?? awayLabel
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
