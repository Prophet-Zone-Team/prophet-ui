"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import { findGameMarketOutcome } from "@/lib/market/game-outcome-price";
import { formatMatchScore } from "@/lib/market/match-display";
import { isEffectiveLiveMatch } from "@/lib/market/live-match";
import {
  filterGameBinaryFixtureChartByRange,
  filterGameFixtureChartByRange
} from "@/lib/market/fixture-probability-chart";
import {
  filterLiveBinaryFixtureChartByRange,
  filterLiveFixtureChartByRange,
  resolveKickoffElapsedSeconds,
  resolveLiveChartMaxElapsed,
  resolveLiveChartPriceHistoryKickoffAt,
  resolveMatchClockElapsedSeconds
} from "@/lib/market/live-fixture-probability-chart";
import {
  isMockLiveFixtureEnabled,
  MOCK_LIVE_FIXTURE_ELAPSED_SECONDS
} from "@/lib/market/mock-live-fixture-config";
import {
  isEndedMatchStatus,
  resolveMatchSides
} from "@/lib/market/schedule-match";
import { useGameStatistics } from "@/hooks/market/use-game-statistics";
import { useProbabilityChart } from "@/hooks/market/use-probability-chart";
import { useMatchWithLiveState } from "@/store/match-live-store";
import {
  useSelectedFixtureOutcome,
  useTradeMatchOutcomeSide,
  useTradeOutcomeSide
} from "@/store/trade-ticket-store";
import type {
  FixtureChartKind,
  FixtureMarketOutcome,
  GameFixtureChartTimeRange,
  GameFixtureMarketsSnapshot,
  GameMarketOutcome,
  GameMarketSnapshot,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import { resolveOrderbookTokenId } from "@/views/trade/game/markets/fixture-market-actions";
import { gameColors } from "@/views/trade/game/ui";
import { GameBinaryProbabilityChart } from "@/views/trade/game-probability/binary-chart";
import { GameProbabilityChart } from "@/views/trade/game-probability/chart";
import { useLiveMatchProbabilityChart } from "@/views/trade/game-probability/use-live-match-probability-chart";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { OrderbookPanel } from "@/views/trade/orderbook-panel";

const GAME_PROBABILITY_TIME_RANGES = [
  { id: "1H", label: "1H" },
  { id: "1D", label: "1D" },
  { id: "1W", label: "1W" },
  { id: "1M", label: "1M" },
  { id: "all", label: "All" }
] as const satisfies ReadonlyArray<{
  id: GameFixtureChartTimeRange;
  label: string;
}>;

const probabilityCardClass =
  "min-w-0 flex-1 rounded-[12px] border border-[#EBEBEB] bg-white p-4 sm:p-5";

export type ProbabilitySummaryItem = {
  label: string;
  value: number;
  color?: string;
  code?: string;
};

export interface GameProbabilitySectionProps {
  match: WorldCupMatch;
  snapshots?: TeamMarketSnapshot[];
  gameSnapshot?: GameMarketSnapshot;
  fixtureMarkets?: GameFixtureMarketsSnapshot;
  showOrderbook?: boolean;
  className?: string;
  chartKind?: FixtureChartKind;
  lineKey?: string;
  summaryMode?: "ternary" | "binary";
  summaryItems?: ProbabilitySummaryItem[];
  binaryPrimaryLabel?: string;
  binarySecondaryLabel?: string;
}

export function GameProbabilitySection({
  match,
  snapshots = [],
  gameSnapshot,
  fixtureMarkets,
  showOrderbook = true,
  className,
  chartKind = "moneyline",
  lineKey,
  summaryMode = "ternary",
  summaryItems,
  binaryPrimaryLabel,
  binarySecondaryLabel
}: GameProbabilitySectionProps) {
  const t = useTranslations("trade");
  const tAuth = useTranslations("auth");
  const liveMatch = useMatchWithLiveState(match);
  const mockLiveFixture = isMockLiveFixtureEnabled();
  const isLive = isEffectiveLiveMatch(liveMatch) || mockLiveFixture;
  const liveMatchForChart = mockLiveFixture
    ? {
        ...liveMatch,
        status: "live" as const,
        liveElapsedSeconds: MOCK_LIVE_FIXTURE_ELAPSED_SECONDS
      }
    : liveMatch;
  const [timeRange, setTimeRange] = useState<GameFixtureChartTimeRange>(() =>
    isLive ? "1H" : "all"
  );
  const matchOutcomeSide = useTradeMatchOutcomeSide();
  const selectedFixtureOutcome = useSelectedFixtureOutcome();
  const tradeOutcomeSide = useTradeOutcomeSide();

  useEffect(() => {
    if (isLive) {
      setTimeRange("1D");
    }
  }, [isLive]);
  const liveChartActive =
    isLive && Boolean(chartKind) && Boolean(gameSnapshot && fixtureMarkets);
  const chartPollIntervalMs = isEndedMatchStatus(liveMatch.status)
    ? undefined
    : 5000;
  const sides = resolveMatchSides(liveMatch, snapshots);
  const homeLabel = sides.home.name ?? t("home");
  const awayLabel = sides.away.name ?? t("away");
  const { goalEvents } = useGameStatistics({
    match: liveMatch,
    homeTeamName: homeLabel,
    awayTeamName: awayLabel,
    includeGoalEvents: liveChartActive
  });
  const matchClockElapsedSeconds = useMemo(
    () =>
      resolveMatchClockElapsedSeconds(
        liveMatchForChart.liveElapsedSeconds,
        goalEvents
      ),
    [goalEvents, liveMatchForChart.liveElapsedSeconds]
  );
  const priceHistoryKickoffAt = useMemo(
    () => resolveLiveChartPriceHistoryKickoffAt(liveMatchForChart),
    [liveMatchForChart]
  );
  const elapsedFromStartTime = useMemo(
    () =>
      priceHistoryKickoffAt
        ? resolveKickoffElapsedSeconds(priceHistoryKickoffAt)
        : undefined,
    [priceHistoryKickoffAt]
  );
  const liveAxisElapsedSeconds = useMemo(
    () =>
      Math.max(elapsedFromStartTime ?? 0, matchClockElapsedSeconds ?? 0) ||
      undefined,
    [elapsedFromStartTime, matchClockElapsedSeconds]
  );
  const {
    points: rawPoints,
    binaryPoints: rawBinaryPoints,
    chartMode,
    status,
    error,
    refetch
  } = useProbabilityChart({
    kind: "fixture",
    match,
    chartKind,
    lineKey,
    timeRange,
    pollIntervalMs: chartPollIntervalMs,
    enabled: !liveChartActive
  });

  const liveChart = useLiveMatchProbabilityChart({
    match: liveMatchForChart,
    gameSnapshot: gameSnapshot!,
    fixtureMarkets: fixtureMarkets!,
    chartKind: chartKind ?? "moneyline",
    lineKey,
    enabled: liveChartActive,
    matchClockElapsedSeconds,
    pollIntervalMs: chartPollIntervalMs
  });
  const displayScore = {
    homeScore: liveMatch.homeScore,
    awayScore: liveMatch.awayScore
  };
  const orderbookEnabled = showOrderbook && Boolean(gameSnapshot);

  const fallbackOutcome = useMemo(() => {
    if (!gameSnapshot) {
      return undefined;
    }

    return findGameMarketOutcome(gameSnapshot.outcomes, matchOutcomeSide);
  }, [gameSnapshot, matchOutcomeSide]);

  const tokenId = useMemo(
    () =>
      resolveOrderbookTokenId(
        selectedFixtureOutcome,
        tradeOutcomeSide,
        fallbackOutcome
          ? {
              tokenId: fallbackOutcome.tokenId,
              noTokenId: fallbackOutcome.noTokenId
            }
          : undefined
      ),
    [fallbackOutcome, selectedFixtureOutcome, tradeOutcomeSide]
  );

  const resolvedSummaryItems = useMemo(
    () =>
      summaryItems ??
      buildDefaultSummaryItems({
        summaryMode,
        gameSnapshot,
        homeLabel,
        drawLabel: t("draw"),
        awayLabel,
        homeCode: sides.home.code,
        awayCode: sides.away.code
      }),
    [
      awayLabel,
      gameSnapshot,
      homeLabel,
      sides.away.code,
      sides.home.code,
      summaryItems,
      summaryMode,
      t
    ]
  );

  const effectiveChartMode = liveChartActive
    ? liveChart.chartMode
    : chartMode === "binary" || summaryMode === "binary"
      ? "binary"
      : "ternary";
  const filteredPoints = useMemo(
    () => filterGameFixtureChartByRange(rawPoints, timeRange),
    [rawPoints, timeRange]
  );
  const filteredBinaryPoints = useMemo(
    () => filterGameBinaryFixtureChartByRange(rawBinaryPoints, timeRange),
    [rawBinaryPoints, timeRange]
  );
  const liveFilteredPoints = useMemo(
    () =>
      filterLiveFixtureChartByRange(
        liveChart.points,
        timeRange,
        liveAxisElapsedSeconds
      ),
    [liveChart.points, liveAxisElapsedSeconds, timeRange]
  );
  const liveFilteredBinaryPoints = useMemo(
    () =>
      filterLiveBinaryFixtureChartByRange(
        liveChart.binaryPoints,
        timeRange,
        liveAxisElapsedSeconds
      ),
    [liveChart.binaryPoints, liveAxisElapsedSeconds, timeRange]
  );
  const liveMaxElapsedSeconds = useMemo(() => {
    if (!liveChartActive) {
      return liveChart.maxElapsedSeconds;
    }

    const points =
      effectiveChartMode === "binary"
        ? liveFilteredBinaryPoints
        : liveFilteredPoints;

    return resolveLiveChartMaxElapsed(
      priceHistoryKickoffAt,
      points,
      timeRange,
      liveAxisElapsedSeconds
    );
  }, [
    effectiveChartMode,
    liveAxisElapsedSeconds,
    liveChart.maxElapsedSeconds,
    liveChartActive,
    liveFilteredBinaryPoints,
    liveFilteredPoints,
    priceHistoryKickoffAt,
    timeRange
  ]);
  const chartPoints = liveChartActive ? liveFilteredPoints : filteredPoints;
  const chartBinaryPoints = liveChartActive
    ? liveFilteredBinaryPoints
    : filteredBinaryPoints;

  const chartStatus = liveChartActive ? liveChart.status : status;
  const chartTimeRanges = useMemo(
    () =>
      GAME_PROBABILITY_TIME_RANGES.map((range) => ({
        ...range,
        label: range.id === "all" ? t("chartRangeAll") : range.label
      })),
    [t]
  );

  return (
    <section
      className={cn(
        "mt-[8px] flex flex-col gap-3 xl:flex-row xl:items-stretch",
        !orderbookEnabled && "xl:flex-col",
        className
      )}
      aria-label={t("matchOutcomeProbabilityAria")}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.85 }}
        className={cn(probabilityCardClass, !orderbookEnabled && "w-full")}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-[18px] font-[500] leading-6 text-black">
              {t("probabilityLabel")}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {isLive ? (
              <LiveScoreBadge
                homeCode={sides.home.code}
                homeName={homeLabel}
                awayCode={sides.away.code}
                awayName={awayLabel}
                score={formatMatchScore(
                  displayScore.homeScore,
                  displayScore.awayScore
                )}
              />
            ) : null}

            {!isLive ? (
              <div
                className="flex flex-wrap gap-4"
                role="group"
                aria-label={t("chartTimeRangeAria")}
              >
                {chartTimeRanges.map((range) => (
                  <button
                    key={range.id}
                    type="button"
                    className={cn(
                      "border-0 bg-transparent p-0 text-[14px] leading-[17px]",
                      timeRange === range.id
                        ? "font-[500] text-black"
                        : "font-[400] text-[#909090]"
                    )}
                    onClick={() => setTimeRange(range.id)}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="">
          {resolvedSummaryItems.length ? (
            <ProbabilitySummaryRow items={resolvedSummaryItems} />
          ) : null}
        </div>

        <div className="mt-4">
          {chartStatus === "loading" ? (
            <ChartStateMessage
              message={
                liveChartActive
                  ? t("loadingLiveProbabilityHistory")
                  : t("loadingProbabilityHistory")
              }
            />
          ) : null}

          {chartStatus === "empty" ? (
            <ChartStateMessage
              message={
                liveChartActive
                  ? t("noLiveProbabilityHistoryAvailable")
                  : t("noProbabilityHistoryAvailable")
              }
            />
          ) : null}

          {chartStatus === "error" ? (
            <ChartStateMessage
              message={
                liveChartActive
                  ? t("unableToLoadLiveProbabilityHistory")
                  : t("unableToLoadProbabilityHistory")
              }
              actionLabel={tAuth("retry")}
              onAction={() => {
                void (liveChartActive ? liveChart.refetch() : refetch());
              }}
            />
          ) : null}

          {chartStatus === "ready" && effectiveChartMode === "ternary" ? (
            <GameProbabilityChart
              data={chartPoints}
              homeLabel={homeLabel}
              drawLabel={t("draw")}
              awayLabel={awayLabel}
              mode={liveChartActive ? "live" : "historical"}
              timeRange={timeRange}
              events={liveChartActive ? goalEvents : []}
              maxElapsedSeconds={liveMaxElapsedSeconds}
              kickoffAt={liveChartActive ? priceHistoryKickoffAt : undefined}
              homeCode={sides.home.code}
              awayCode={sides.away.code}
            />
          ) : null}

          {chartStatus === "ready" && effectiveChartMode === "binary" ? (
            <GameBinaryProbabilityChart
              data={chartBinaryPoints}
              primaryLabel={
                binaryPrimaryLabel ?? resolvedSummaryItems[0]?.label
              }
              secondaryLabel={
                binarySecondaryLabel ?? resolvedSummaryItems[1]?.label
              }
              primaryColor={resolvedSummaryItems[0]?.color ?? gameColors.home}
              secondaryColor={
                resolvedSummaryItems[1]?.color ?? gameColors.awayBar
              }
              mode={liveChartActive ? "live" : "historical"}
              timeRange={timeRange}
              events={liveChartActive ? goalEvents : []}
              maxElapsedSeconds={liveMaxElapsedSeconds}
              kickoffAt={liveChartActive ? priceHistoryKickoffAt : undefined}
              homeCode={sides.home.code}
              awayCode={sides.away.code}
            />
          ) : null}
        </div>
      </motion.div>

      <OrderbookPanel
        visible={orderbookEnabled}
        tokenId={tokenId}
        className="w-full shrink-0 xl:w-[272px]"
      />
    </section>
  );
}

function buildDefaultSummaryItems({
  summaryMode,
  gameSnapshot,
  homeLabel,
  drawLabel,
  awayLabel,
  homeCode,
  awayCode
}: {
  summaryMode: "ternary" | "binary";
  gameSnapshot?: GameMarketSnapshot;
  homeLabel: string;
  drawLabel: string;
  awayLabel: string;
  homeCode?: string;
  awayCode?: string;
}): ProbabilitySummaryItem[] {
  if (!gameSnapshot) {
    return [];
  }

  if (summaryMode === "binary") {
    return [];
  }

  const home = gameSnapshot.outcomes.find((item) => item.side === "home");
  const draw = gameSnapshot.outcomes.find((item) => item.side === "draw");
  const away = gameSnapshot.outcomes.find((item) => item.side === "away");

  return [
    {
      label: homeLabel,
      value: home?.probability ?? 0,
      color: gameColors.home,
      code: homeCode
    },
    {
      label: drawLabel,
      value: draw?.probability ?? 0,
      color: gameColors.draw
    },
    {
      label: awayLabel,
      value: away?.probability ?? 0,
      color: gameColors.awayBar,
      code: awayCode
    }
  ];
}

function ProbabilitySummaryItemLabel({
  code,
  label
}: Pick<ProbabilitySummaryItem, "code" | "label">) {
  const displayLabel = useLocalizedTeamName(code, label);

  return (
    <span className="text-[12px] font-[400] leading-[17px] text-[#909090]">
      {displayLabel}
    </span>
  );
}

function ProbabilitySummaryRow({ items }: { items: ProbabilitySummaryItem[] }) {
  return (
    <div className="w-full mt-3 flex flex-wrap items-center gap-x-2 md:gap-x-6 gap-y-2">
      {items.map((item, index) => (
        <div
          key={`${item.code ?? item.label}-${index}`}
          className="inline-flex items-center gap-1 md:gap-2"
        >
          <span
            className="w-[12px] h-[12px] shrink-0 rounded-full"
            style={{ backgroundColor: item.color ?? gameColors.draw }}
            aria-hidden
          />
          <ProbabilitySummaryItemLabel code={item.code} label={item.label} />
          <span className="text-[12px] font-[500] leading-[17px] text-black">
            {Math.round(item.value)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function ChartStateMessage({
  message,
  actionLabel,
  onAction
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-[#EBEBEB] px-4 py-8 text-center">
      <p className="m-0 text-sm font-[400] leading-[17px] text-[#909090]">
        {message}
      </p>
      {actionLabel && onAction ? (
        <button
          type="button"
          className="border-0 bg-transparent p-0 text-sm font-[500] leading-[17px] text-black underline"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function LiveScoreBadge({
  homeCode,
  homeName,
  awayCode,
  awayName,
  score
}: {
  homeCode?: string;
  homeName: string;
  awayCode?: string;
  awayName: string;
  score: string;
}) {
  const t = useTranslations("trade");
  const [homeScore, awayScore] = score.split("-");

  return (
    <div className="flex items-center gap-3 text-sm font-[500] leading-[17px]">
      <span className="inline-flex items-center gap-1.5 text-[#65AF14]">
        <span className="size-2 rounded-full bg-[#65AF14]" aria-hidden />
        {t("liveBadge")}
      </span>

      <span className="inline-flex items-center gap-1.5 text-black">
        <TeamFlag
          code={homeCode}
          name={homeName}
          className="!h-4 !w-4 rounded-[2px]"
        />
        {homeScore?.trim() ?? "—"}
      </span>

      <span className="inline-flex items-center gap-1.5 text-black">
        <TeamFlag
          code={awayCode}
          name={awayName}
          className="!h-4 !w-4 rounded-[2px]"
        />
        {awayScore?.trim() ?? "—"}
      </span>
    </div>
  );
}

export function buildTernarySummaryFromOutcomes(
  outcomes: Array<
    Pick<FixtureMarketOutcome | GameMarketOutcome, "side" | "probability">
  >,
  homeLabel: string,
  awayLabel: string,
  drawLabel: string,
  homeCode?: string,
  awayCode?: string
): ProbabilitySummaryItem[] {
  const home = outcomes.find((item) => item.side === "home");
  const draw = outcomes.find((item) => item.side === "draw");
  const away = outcomes.find((item) => item.side === "away");

  return [
    {
      label: homeLabel,
      value: home?.probability ?? 0,
      color: gameColors.home,
      code: homeCode
    },
    {
      label: drawLabel,
      value: draw?.probability ?? 0,
      color: gameColors.draw
    },
    {
      label: awayLabel,
      value: away?.probability ?? 0,
      color: gameColors.awayBar,
      code: awayCode
    }
  ];
}

export function buildBinarySummaryFromOutcomes(
  outcomes: FixtureMarketOutcome[],
  primarySide: string,
  secondarySide: string,
  primaryLabel: string,
  secondaryLabel: string,
  primaryCode?: string,
  secondaryCode?: string
): ProbabilitySummaryItem[] {
  const primary = outcomes.find((item) => item.side === primarySide);
  const secondary = outcomes.find((item) => item.side === secondarySide);

  return [
    {
      label: primaryLabel,
      value: primary?.probability ?? 0,
      color: gameColors.home,
      code: primaryCode
    },
    {
      label: secondaryLabel,
      value: secondary?.probability ?? 0,
      color: gameColors.awayBar,
      code: secondaryCode
    }
  ];
}
