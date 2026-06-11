"use client";

import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";

import { useAnalyticsImpression } from "@/hooks/analytics/use-analytics-impression";
import {
  trackWinnerChartRangeChanged,
  trackWinnerChartTeamSelected
} from "@/lib/analytics/tracking";

import {
  formatProbability,
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
import { useProbabilityChart } from "@/hooks/market/use-probability-chart";
import { useTeamGameResults } from "@/hooks/market/use-team-game-results";
import { resolveTeamOrderbookTokenId } from "@/lib/market/resolve-team-orderbook-token";
import type { TeamMarketSnapshot } from "@/types/market";
import {
  useSetTradeOutcomeSide,
  useTradeOutcomeSide
} from "@/store/trade-ticket-store";
import { OrderbookPanel } from "@/views/trade/orderbook-panel";
import { ProbabilityChart } from "@/views/trade/team-probability/chart";
import { tradeYesNoPill } from "@/views/trade/trade-widget/trade-ui";

const probabilityCardClass =
  "min-w-0 flex-1 rounded-[12px] border border-[#EBEBEB] bg-white p-4 sm:p-5";

export interface ProbabilitySectionProps {
  snapshot: TeamMarketSnapshot;
  showOrderbook: boolean;
}

export function ProbabilitySection({
  snapshot,
  showOrderbook
}: ProbabilitySectionProps) {
  const outcomeView = useTradeOutcomeSide();
  const setOutcomeView = useSetTradeOutcomeSide();
  const [timeRange, setTimeRange] = useState<TeamChartTimeRange>("all");
  const previousTimeRangeRef = useRef<TeamChartTimeRange>("all");
  const chartRef = useAnalyticsImpression<HTMLElement>({
    eventName: "chart_viewed",
    dedupeKey: `chart:team_probability:${snapshot.team.id}`,
    payload: {
      chartId: "team_probability",
      section: "team_probability"
    }
  });
  const yesTokenId = resolveTeamOrderbookTokenId(snapshot, "yes");
  const { points: probabilityHistory } = useProbabilityChart({
    kind: "team",
    tokenId: yesTokenId,
    entityId: snapshot.team.id,
    pollIntervalMs: 5000,
    enabled: Boolean(yesTokenId)
  });
  const { matches: teamGameMatches } = useTeamGameResults({
    teamName: snapshot.team.name,
    teamId: snapshot.team.id
  });
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
        matches: teamGameMatches,
        chartData,
        snapshots: [snapshot]
      }),
    [chartData, snapshot, teamGameMatches]
  );

  const yDomain = useMemo(() => getTeamChartYDomain(chartData), [chartData]);
  const tokenId = useMemo(
    () => resolveTeamOrderbookTokenId(snapshot, outcomeView),
    [outcomeView, snapshot]
  );

  const change24h = snapshot.market.change24h;
  const change24hPoints = outcomeView === "yes" ? change24h : -change24h;
  const change24hLabel = change24h;
  const changeTone =
    change24hPoints > 0
      ? "text-[#65AF14]"
      : change24hPoints < 0
        ? "text-[#FF674B]"
        : "text-prophet-muted";

  return (
    <section
      ref={chartRef}
      className={cn(
        "flex flex-col gap-3",
        showOrderbook
          ? "xl:grid xl:grid-cols-[minmax(0,1fr)_272px] xl:items-stretch"
          : "xl:flex-col"
      )}
      aria-label="Winner probability"
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.85 }}
        className={cn(
          probabilityCardClass,
          !showOrderbook && "w-full",
          showOrderbook && "min-h-0"
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="m-0 text-[20px] font-[500] leading-6 text-black">
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
                onClick={() => {
                  trackWinnerChartTeamSelected({
                    chartId: "team_probability",
                    seriesKey: "yes",
                    teamId: snapshot.team.id,
                    teamName: snapshot.team.name,
                    teamCode: snapshot.team.code
                  });
                  setOutcomeView("yes");
                }}
              >
                Yes
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1",
                  tradeYesNoPill(outcomeView === "no", "no")
                )}
                onClick={() => {
                  trackWinnerChartTeamSelected({
                    chartId: "team_probability",
                    seriesKey: "no",
                    teamId: snapshot.team.id,
                    teamName: snapshot.team.name,
                    teamCode: snapshot.team.code
                  });
                  setOutcomeView("no");
                }}
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
                    ? "font-[500] text-black"
                    : "font-[400] text-[#909090]"
                )}
                onClick={() => {
                  trackWinnerChartRangeChanged({
                    chartId: "team_probability",
                    fromRange: previousTimeRangeRef.current,
                    toRange: range.id,
                    teamId: snapshot.team.id,
                    teamName: snapshot.team.name
                  });
                  previousTimeRangeRef.current = range.id;
                  setTimeRange(range.id);
                }}
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
            value={change24h.toString()}
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
            timeRange={timeRange}
          />
        </div>
      </motion.div>

      <OrderbookPanel
        visible={showOrderbook}
        tokenId={tokenId}
        className="min-h-0 w-full"
      />
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
          "m-0 font-[500] text-black",
          valueClassName ?? "text-base leading-[19px]"
        )}
      >
        {value}
      </p>
      <p className="m-0 mt-1 text-sm font-[500] leading-[17px] text-[#909090]">
        {label}
      </p>
    </div>
  );
}
