"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import { findGameMarketOutcome } from "@/lib/market/game-outcome-price";
import { formatMatchScore } from "@/lib/market/match-display";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import {
  useSelectedFixtureOutcome,
  useTradeMatchOutcomeSide,
  useTradeOutcomeSide
} from "@/store/trade-ticket-store";
import type {
  FixtureChartKind,
  FixtureMarketOutcome,
  GameFixtureChartTimeRange,
  GameMarketOutcome,
  GameMarketSnapshot,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import { resolveOrderbookTokenId } from "@/views/trade/game/markets/fixture-market-actions";
import { gameColors } from "@/views/trade/game/ui";
import { GameBinaryProbabilityChart } from "@/views/trade/game-probability/binary-chart";
import { GameProbabilityChart } from "@/views/trade/game-probability/chart";
import { useFixturePriceHistory } from "@/views/trade/game-probability/use-fixture-price-history";
import { OrderbookPanel } from "@/views/trade/orderbook-panel";

const GAME_PROBABILITY_TIME_RANGES = [
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
  showOrderbook = true,
  className,
  chartKind = "moneyline",
  lineKey,
  summaryMode = "ternary",
  summaryItems,
  binaryPrimaryLabel,
  binarySecondaryLabel
}: GameProbabilitySectionProps) {
  const [timeRange, setTimeRange] = useState<GameFixtureChartTimeRange>("all");
  const matchOutcomeSide = useTradeMatchOutcomeSide();
  const selectedFixtureOutcome = useSelectedFixtureOutcome();
  const tradeOutcomeSide = useTradeOutcomeSide();
  const { points, binaryPoints, chartMode, status, error, refetch } =
    useFixturePriceHistory({
      matchSlug: match.id,
      timeRange,
      chartKind,
      lineKey
    });

  const sides = resolveMatchSides(match, snapshots);
  const isLive = match.status === "live";
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

  const homeLabel = sides.home.name ?? "Home";
  const awayLabel = sides.away.name ?? "Away";
  const resolvedSummaryItems = useMemo(
    () =>
      summaryItems ??
      buildDefaultSummaryItems({
        summaryMode,
        gameSnapshot,
        homeLabel,
        awayLabel
      }),
    [awayLabel, gameSnapshot, homeLabel, summaryItems, summaryMode]
  );

  const effectiveChartMode =
    chartMode === "binary" || summaryMode === "binary" ? "binary" : "ternary";

  return (
    <section
      className={cn(
        "mt-[8px] flex flex-col gap-3 xl:flex-row xl:items-stretch",
        !orderbookEnabled && "xl:flex-col",
        className
      )}
      aria-label="Match outcome probability"
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.85 }}
        className={cn(probabilityCardClass, !orderbookEnabled && "w-full")}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-[18px] font-[500] leading-6 text-black">
              Probability
            </h2>
            {resolvedSummaryItems.length ? (
              <ProbabilitySummaryRow items={resolvedSummaryItems} />
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {isLive ? (
              <LiveScoreBadge
                homeCode={sides.home.code}
                homeName={homeLabel}
                awayCode={sides.away.code}
                awayName={awayLabel}
                score={formatMatchScore(match.homeScore, match.awayScore)}
              />
            ) : null}

            <div
              className="flex flex-wrap gap-4"
              role="group"
              aria-label="Chart time range"
            >
              {GAME_PROBABILITY_TIME_RANGES.map((range) => (
                <button
                  key={range.id}
                  type="button"
                  className={cn(
                    "border-0 bg-transparent p-0 text-[14px] leading-[17px]",
                    timeRange === range.id
                      ? "font-[556] text-black"
                      : "font-[457] text-[#909090]"
                  )}
                  onClick={() => setTimeRange(range.id)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          {status === "loading" ? (
            <ChartStateMessage message="Loading market price history..." />
          ) : null}

          {status === "empty" ? (
            <ChartStateMessage message="No price history available for this market." />
          ) : null}

          {status === "error" ? (
            <ChartStateMessage
              message={error ?? "Unable to load market price history."}
              actionLabel="Retry"
              onAction={() => {
                void refetch();
              }}
            />
          ) : null}

          {status === "ready" && effectiveChartMode === "ternary" ? (
            <GameProbabilityChart
              data={points}
              homeLabel={homeLabel}
              drawLabel="Draw"
              awayLabel={awayLabel}
            />
          ) : null}

          {status === "ready" && effectiveChartMode === "binary" ? (
            <GameBinaryProbabilityChart
              data={binaryPoints}
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
  awayLabel
}: {
  summaryMode: "ternary" | "binary";
  gameSnapshot?: GameMarketSnapshot;
  homeLabel: string;
  awayLabel: string;
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
      color: gameColors.home
    },
    {
      label: "Draw",
      value: draw?.probability ?? 0,
      color: gameColors.draw
    },
    {
      label: awayLabel,
      value: away?.probability ?? 0,
      color: gameColors.awayBar
    }
  ];
}

function ProbabilitySummaryRow({ items }: { items: ProbabilitySummaryItem[] }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
      {items.map((item) => (
        <div key={item.label} className="inline-flex items-center gap-2">
          <span
            className="w-[12px] h-[12px] shrink-0 rounded-full"
            style={{ backgroundColor: item.color ?? gameColors.draw }}
            aria-hidden
          />
          <span className="text-[12px] font-[457] leading-[17px] text-[#909090]">
            {item.label}
          </span>
          <span className="text-[12px] font-[556] leading-[17px] text-black">
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
      <p className="m-0 text-sm font-[457] leading-[17px] text-[#909090]">
        {message}
      </p>
      {actionLabel && onAction ? (
        <button
          type="button"
          className="border-0 bg-transparent p-0 text-sm font-[556] leading-[17px] text-black underline"
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
  const [homeScore, awayScore] = score.split("-");

  return (
    <div className="flex items-center gap-3 text-sm font-[556] leading-[17px]">
      <span className="inline-flex items-center gap-1.5 text-[#65AF14]">
        <span className="size-2 rounded-full bg-[#65AF14]" aria-hidden />
        LIVE
      </span>

      <span className="inline-flex items-center gap-1.5 text-black">
        <TeamFlag
          code={homeCode}
          name={homeName}
          className="!h-4 !w-4 rounded-[2px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
        />
        {homeScore?.trim() ?? "—"}
      </span>

      <span className="inline-flex items-center gap-1.5 text-black">
        <TeamFlag
          code={awayCode}
          name={awayName}
          className="!h-4 !w-4 rounded-[2px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
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
      label: "Draw",
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
  secondaryLabel: string
): ProbabilitySummaryItem[] {
  const primary = outcomes.find((item) => item.side === primarySide);
  const secondary = outcomes.find((item) => item.side === secondarySide);

  return [
    {
      label: primaryLabel,
      value: primary?.probability ?? 0,
      color: gameColors.home
    },
    {
      label: secondaryLabel,
      value: secondary?.probability ?? 0,
      color: gameColors.awayBar
    }
  ];
}
