"use client";

import { useMemo, useState } from "react";

import {
  formatProbability,
  formatRelativeChange,
  formatVolume
} from "@/components/home/market-formatters";
import { cn } from "@/lib/cn";
import { buildTeamChartMatchAnnotations } from "@/lib/team/chart-match-annotations";
import {
  filterTeamChartByRange,
  getTeamChartYDomain,
  resolveTeamChartData,
  TEAM_CHART_TIME_RANGES,
  type TeamChartTimeRange
} from "@/lib/team/probability-history";
import type {
  OrderOutcomeSide,
  ProbabilityHistoryPoint,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import { Orderbook } from "@/views/trade/team/orderbook";
import { ProbabilityChart } from "@/views/trade/team-probability/chart";
import { tradeYesNoPill } from "@/views/trade/trade-widget/trade-ui";

const probabilityCardClass =
  "min-w-0 flex-1 rounded-[12px] border border-[#EBEBEB] bg-white p-4 sm:p-5";

export interface ProbabilitySectionProps {
  snapshot: TeamMarketSnapshot;
  probabilityHistory: ProbabilityHistoryPoint[];
  matches: WorldCupMatch[];
  snapshots: TeamMarketSnapshot[];
  showOrderbook: boolean;
}

export function ProbabilitySection({
  snapshot,
  probabilityHistory,
  matches,
  snapshots,
  showOrderbook
}: ProbabilitySectionProps) {
  const [outcomeView, setOutcomeView] = useState<OrderOutcomeSide>("yes");
  const [timeRange, setTimeRange] = useState<TeamChartTimeRange>("1M");

  const yesProbability = snapshot.market.probability;
  const noProbability = Math.max(0, 100 - yesProbability);
  const displayProbability =
    outcomeView === "yes" ? yesProbability : noProbability;

  const chartData = useMemo(() => {
    const base = resolveTeamChartData(snapshot, probabilityHistory);
    const filtered = filterTeamChartByRange(base, timeRange);

    if (outcomeView === "no") {
      return filtered.map((point) => ({
        ...point,
        probability: Number(Math.max(0.1, 100 - point.probability).toFixed(1))
      }));
    }

    return filtered;
  }, [outcomeView, probabilityHistory, snapshot, timeRange]);

  const annotations = useMemo(
    () =>
      buildTeamChartMatchAnnotations({
        teamId: snapshot.team.id,
        matches,
        chartData,
        snapshots
      }),
    [chartData, matches, snapshot.team.id, snapshots]
  );

  const yDomain = useMemo(() => getTeamChartYDomain(chartData), [chartData]);
  const tokenId =
    snapshot.market.polymarket?.tokens[outcomeView]?.tokenId ??
    snapshot.market.polymarket?.tokens.yes?.tokenId;

  const change24h = snapshot.market.change24h;
  const change24hPoints = outcomeView === "yes" ? change24h : -change24h;
  const change24hLabel = formatRelativeChange(
    displayProbability,
    change24hPoints
  );
  const changeTone =
    change24hPoints > 0
      ? "text-[#65AF14]"
      : change24hPoints < 0
        ? "text-[#FF674B]"
        : "text-prophet-muted";

  return (
    <section
      className={cn(
        "flex flex-col gap-3 xl:flex-row xl:items-stretch",
        !showOrderbook && "xl:flex-col"
      )}
      aria-label="Winner probability"
    >
      <div className={cn(probabilityCardClass, !showOrderbook && "w-full")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="m-0 text-[20px] font-[556] leading-6 text-black">
              Probability
            </h2>
            <div
              className="flex h-[30px] w-[96px] gap-0.5 rounded-lg border border-[#EBEBEB] bg-white p-0.5"
              role="group"
              aria-label="Outcome view"
            >
              <button
                type="button"
                className={cn(
                  "flex-1",
                  tradeYesNoPill(outcomeView === "yes", "yes")
                )}
                onClick={() => setOutcomeView("yes")}
              >
                Yes
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1",
                  tradeYesNoPill(outcomeView === "no", "no")
                )}
                onClick={() => setOutcomeView("no")}
              >
                No
              </button>
            </div>
          </div>

          <div
            className="flex flex-wrap gap-4"
            role="group"
            aria-label="Chart time range"
          >
            {TEAM_CHART_TIME_RANGES.map((range) => (
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
          <MetricBlock
            value={
              snapshot.market.liquidity
                ? `$${formatVolume(snapshot.market.liquidity)}`
                : "Pending"
            }
            label="Liquidity"
          />
        </div>

        <div className="mt-4">
          <ProbabilityChart
            chartData={chartData}
            yDomain={yDomain}
            annotations={annotations}
          />
        </div>
      </div>

      {showOrderbook ? (
        <Orderbook tokenId={tokenId} className="w-full shrink-0 xl:w-[272px]" />
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
