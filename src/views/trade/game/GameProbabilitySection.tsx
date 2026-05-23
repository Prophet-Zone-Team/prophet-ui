"use client";

import { useMemo, useState } from "react";

import {
  formatProbability,
  formatRelativeChange,
  formatVolume
} from "../../../components/home/market-formatters";
import { MatchProbabilityBar } from "../../home/matches/MatchProbabilityBar";
import { cn } from "../../../lib/cn";
import {
  filterGameChartByRange,
  filterGameHistoryByOutcome,
  GAME_CHART_TIME_RANGES,
  getGameChartYDomain,
  type GameChartTimeRange
} from "../../../lib/market/gameMarketSnapshot";
import { parseMatchOutcomeOdds } from "../../../lib/market/matchOutcomeOdds";
import { resolveMatchSides } from "../../../lib/market/scheduleMatch";
import type {
  GameMarketSnapshot,
  GameProbabilityHistoryPoint,
  MatchOutcomeSide,
  TeamMarketSnapshot
} from "../../../types/market";
import {
  tradeAwayOutcomePill,
  tradeDrawOutcomePill,
  tradeMatchOutcomePill
} from "../tradeUi";
import { GameProbabilityChart } from "./GameProbabilityChart";

const probabilityCardClass =
  "min-w-0 flex-1 rounded-[12px] border border-[#EBEBEB] bg-white p-4 sm:p-5";

export interface GameProbabilitySectionProps {
  snapshot: GameMarketSnapshot;
  probabilityHistory: GameProbabilityHistoryPoint[];
  teamSnapshots: TeamMarketSnapshot[];
  showOrderbook: boolean;
}

export function GameProbabilitySection({
  snapshot,
  probabilityHistory,
  teamSnapshots,
  showOrderbook
}: GameProbabilitySectionProps) {
  const [outcomeView, setOutcomeView] = useState<MatchOutcomeSide>("home");
  const [timeRange, setTimeRange] = useState<GameChartTimeRange>("1M");

  const sides = resolveMatchSides(snapshot.match, teamSnapshots);
  const selectedOutcome = snapshot.outcomes.find((item) => item.side === outcomeView);
  const displayProbability = selectedOutcome?.probability ?? 0;
  const change24h = selectedOutcome?.change24h ?? 0;
  const change24hLabel = formatRelativeChange(displayProbability, change24h);
  const changeTone =
    change24h > 0
      ? "text-[#65AF14]"
      : change24h < 0
        ? "text-[#FF674B]"
        : "text-prophet-muted";

  const barProbabilities = useMemo(() => {
    const oddsResult = parseMatchOutcomeOdds(
      snapshot.match,
      sides.home.name,
      sides.away.name
    );

    if (oddsResult.status === "ready") {
      return oddsResult.probabilities;
    }

    const home = snapshot.outcomes.find((item) => item.side === "home")?.probability ?? 33;
    const draw = snapshot.outcomes.find((item) => item.side === "draw")?.probability ?? 34;
    const away = snapshot.outcomes.find((item) => item.side === "away")?.probability ?? 33;

    return {
      home: home / 100,
      draw: draw / 100,
      away: away / 100
    };
  }, [snapshot.match, snapshot.outcomes, sides.away.name, sides.home.name]);

  const chartData = useMemo(() => {
    const base = filterGameHistoryByOutcome(probabilityHistory, outcomeView);
    return filterGameChartByRange(base, timeRange);
  }, [outcomeView, probabilityHistory, timeRange]);

  const yDomain = useMemo(() => getGameChartYDomain(chartData), [chartData]);

  return (
    <section
      className={cn(
        "flex flex-col gap-3 xl:flex-row xl:items-stretch",
        !showOrderbook && "xl:flex-col"
      )}
      aria-label="Match outcome probability"
    >
      <div className={cn(probabilityCardClass, !showOrderbook && "w-full")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="m-0 text-[20px] font-[556] leading-6 text-black">
              Probability
            </h2>
            <div
              className="flex h-[30px] max-w-full gap-0.5 overflow-x-auto rounded-lg border border-[#EBEBEB] bg-white p-0.5"
              role="group"
              aria-label="Outcome view"
            >
              <button
                type="button"
                className={tradeMatchOutcomePill(outcomeView === "home")}
                onClick={() => setOutcomeView("home")}
              >
                Home
              </button>
              <button
                type="button"
                className={tradeDrawOutcomePill(outcomeView === "draw")}
                onClick={() => setOutcomeView("draw")}
              >
                Draw
              </button>
              <button
                type="button"
                className={tradeAwayOutcomePill(outcomeView === "away")}
                onClick={() => setOutcomeView("away")}
              >
                Away
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4" role="group" aria-label="Chart time range">
            {GAME_CHART_TIME_RANGES.map((range) => (
              <button
                key={range.id}
                type="button"
                className={cn(
                  "border-0 bg-transparent p-0 text-sm leading-[17px]",
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

        <div className="mt-4">
          <MatchProbabilityBar probabilities={barProbabilities} variant="compact" />
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-8 sm:gap-10">
          <MetricBlock
            value={formatProbability(displayProbability)}
            label="Probability"
            valueClassName="text-[36px] leading-[43px] text-black"
          />
          <MetricBlock
            value={change24hLabel}
            label="24h"
            valueClassName={cn("text-base leading-[19px]", changeTone)}
          />
          <MetricBlock
            value={`$${formatVolume(snapshot.market.volume)}`}
            label="Volume"
          />
          <MetricBlock value={snapshot.market.source} label="Source" />
        </div>

        <div className="mt-4">
          <GameProbabilityChart chartData={chartData} yDomain={yDomain} />
        </div>
      </div>

      {showOrderbook ? (
        <aside
          className="flex w-full shrink-0 items-center justify-center rounded-[12px] border border-[#EBEBEB] bg-white p-6 text-sm text-prophet-muted xl:w-[272px]"
          aria-label="Orderbook placeholder"
        >
          Match orderbook preview will appear when a fixture market is linked.
        </aside>
      ) : null}
    </section>
  );
}

function MetricBlock({
  label,
  value,
  valueClassName,
  className
}: {
  label: string;
  value: string;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p
        className={cn(
          "m-0 font-[556] text-black",
          valueClassName ?? "text-base leading-[19px]"
        )}
      >
        {value}
      </p>
      <p className="m-0 mt-1 text-sm font-[556] leading-[17px] text-[#909090]">
        {label}
      </p>
    </div>
  );
}
