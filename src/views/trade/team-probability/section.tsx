"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { useAnalyticsImpression } from "@/hooks/analytics/use-analytics-impression";
import {
  trackWinnerChartRangeChanged,
  trackWinnerChartTeamSelected
} from "@/lib/analytics/tracking";
import { useTranslations } from "next-intl";

import {
  formatChange,
  formatProbability,
  formatVolume,
  getChangeTone
} from "@/components/home/market-formatters";
import { ProbabilityChangeTrend } from "@/components/market/probability-change-trend";
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
import { useLiveTeamSnapshot } from "@/context/market-live-price-ws";
import {
  useSetTradeOutcomeSide,
  useTradeOutcomeSide
} from "@/store/trade-ticket-store";
import { OrderbookPanel } from "@/views/trade/orderbook-panel";
import { ProbabilityChart } from "@/views/trade/team-probability/chart";
import { tradeYesNoPill } from "@/views/trade/trade-widget/trade-ui";

const probabilityCardClass =
  "min-w-0 flex-1 rounded-[12px] border border-[#EBEBEB] bg-white p-4 sm:p-5";

const probabilityCardBorderlessClass = "min-w-0 flex-1 bg-white p-4 sm:p-5";

const orderbookBorderlessClass = "rounded-none border-0";

export interface ProbabilitySectionProps {
  snapshot: TeamMarketSnapshot;
  showOrderbook: boolean;
  showHeaderControls?: boolean;
  groupLayout?: boolean;
  borderless?: boolean;
  showChartOrderbookDivider?: boolean;
}

export function ProbabilitySection({
  snapshot,
  showOrderbook,
  showHeaderControls = true,
  groupLayout = false,
  borderless = false,
  showChartOrderbookDivider = false
}: ProbabilitySectionProps) {
  const t = useTranslations("trade");
  const liveSnapshot = useLiveTeamSnapshot(snapshot);
  const outcomeView = useTradeOutcomeSide();
  const setOutcomeView = useSetTradeOutcomeSide();
  const [timeRange, setTimeRange] = useState<TeamChartTimeRange>("all");
  const [orderbookExpanded, setOrderbookExpanded] = useState(false);
  const previousTimeRangeRef = useRef<TeamChartTimeRange>("all");
  const chartRef = useAnalyticsImpression<HTMLElement>({
    eventName: "chart_viewed",
    dedupeKey: `chart:team_probability:${snapshot.team.id}`,
    payload: {
      chartId: "team_probability",
      section: "team_probability"
    }
  });
  const yesTokenId = resolveTeamOrderbookTokenId(liveSnapshot, "yes");
  const { points: probabilityHistory } = useProbabilityChart({
    kind: "team",
    tokenId: yesTokenId,
    entityId: liveSnapshot.team.id,
    pollIntervalMs: 5000,
    enabled: Boolean(yesTokenId)
  });
  const { matches: teamGameMatches } = useTeamGameResults({
    teamName: snapshot.team.name,
    teamId: snapshot.team.id
  });
  const yesProbability = liveSnapshot.market.probability;
  const noProbability = Math.max(0, 100 - yesProbability);
  const displayProbability =
    outcomeView === "yes" ? yesProbability : noProbability;

  const chartData = useMemo(() => {
    const base = resolveTeamChartData(liveSnapshot, probabilityHistory);
    const filtered = filterTeamChartByRange(base, timeRange);

    if (outcomeView === "no") {
      return filtered.map((point) => ({
        ...point,
        probability: Number(Math.max(0.1, 100 - point.probability).toFixed(1))
      }));
    }

    return filtered;
  }, [liveSnapshot, outcomeView, probabilityHistory, timeRange]);

  const annotations = useMemo(
    () =>
      buildTeamChartMatchAnnotations({
        teamId: liveSnapshot.team.id,
        matches: teamGameMatches,
        chartData,
        snapshots: [liveSnapshot]
      }),
    [chartData, liveSnapshot, teamGameMatches]
  );

  const yDomain = useMemo(() => getTeamChartYDomain(chartData), [chartData]);
  const tokenId = useMemo(
    () => resolveTeamOrderbookTokenId(liveSnapshot, outcomeView),
    [liveSnapshot, outcomeView]
  );

  const change24h = liveSnapshot.market.change24h;
  const change24hPoints = outcomeView === "yes" ? change24h : -change24h;
  const changeTone = getChangeTone(change24hPoints);
  const chartTimeRanges = useMemo(
    () =>
      TEAM_CHART_TIME_RANGES.map((range) => ({
        ...range,
        label: range.id === "all" ? t("chartRangeAll") : range.label
      })),
    [t]
  );
  const yesNoToggle = (
    <div
      className="flex h-[30px] w-[96px] gap-0.5 rounded-lg border border-[#EBEBEB] bg-white p-0.5"
      role="group"
      aria-label={t("outcomeViewAria")}
    >
      <button
        type="button"
        className={cn("flex-1", tradeYesNoPill(outcomeView === "yes", "yes"))}
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
        {t("yes")}
      </button>
      <button
        type="button"
        className={cn("flex-1", tradeYesNoPill(outcomeView === "no", "no"))}
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
        {t("no")}
      </button>
    </div>
  );

  const timeRangeButtons = (
    <>
      {chartTimeRanges.map((range) => (
        <button
          key={range.id}
          type="button"
          className={cn(
            "border-0 bg-transparent p-0 md:text-sm text-[12px] leading-[17px]",
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
    </>
  );

  const groupMetricBlocks = (
    <div>
      <div className="flex items-end gap-2">
        <p className="m-0 text-[20px] font-[500] leading-[24px] text-black md:text-[36px] md:leading-[43px]">
          {formatProbability(displayProbability)}
        </p>
        {!!change24hPoints ? (
          <ProbabilityChangeTrend
            changePercent={change24hPoints}
            decimals={1}
          />
        ) : null}
      </div>
      <p className="m-0 mt-1 hidden text-sm font-[500] leading-[17px] text-[#909090] md:block">
        {t("probabilityLabel")}
      </p>
    </div>
  );

  const marketMetricBlocks = (
    <>
      <MetricBlock
        value={formatProbability(displayProbability)}
        label={t("probabilityLabel")}
        valueClassName="text-[36px] leading-[43px] text-black"
      />
      <MetricBlock
        value={formatChange(change24hPoints)}
        label={t("change24h")}
        valueClassName={cn("text-base leading-[19px]", changeTone)}
      />
      <MetricBlock
        value={`$${formatVolume(snapshot.market.volume)}`}
        label={t("volumeLabel")}
      />
      <MetricBlock
        value={
          liveSnapshot.market.liquidity
            ? `$${formatVolume(liveSnapshot.market.liquidity)}`
            : t("pending")
        }
        label={t("liquidity")}
      />
    </>
  );

  const timeRangeControls = (
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
  );

  const chartCardClass = borderless
    ? probabilityCardBorderlessClass
    : probabilityCardClass;

  return (
    <section
      ref={chartRef}
      className={cn(
        "flex flex-col",
        showChartOrderbookDivider ? "gap-0" : "gap-3",
        showOrderbook && showChartOrderbookDivider
          ? "xl:grid xl:grid-cols-[minmax(0,1fr)_1px_272px] xl:items-stretch xl:gap-0"
          : showOrderbook
            ? "xl:grid xl:grid-cols-[minmax(0,1fr)_272px] xl:items-stretch"
            : "xl:flex-col"
      )}
      aria-label={t("winnerProbabilityAria")}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.85 }}
        className={cn(
          chartCardClass,
          !showOrderbook && "w-full",
          showOrderbook && "min-h-0"
        )}
      >
        {showHeaderControls ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="m-0 text-[16px] font-[500] leading-6 text-black md:text-[20px]">
                {t("probabilityLabel")}
              </h2>
              {yesNoToggle}
            </div>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div className="flex min-w-0 flex-wrap items-end gap-8 sm:gap-10">
                {groupMetricBlocks}
              </div>
              <div
                className="flex flex-wrap gap-4"
                role="group"
                aria-label={t("chartTimeRangeAria")}
              >
                {timeRangeButtons}
              </div>
            </div>

            {!groupLayout ? (
              <div className="mt-4 hidden flex-wrap items-end gap-8 sm:gap-10 md:flex">
                {marketMetricBlocks}
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 flex-wrap items-end gap-8 sm:gap-10">
              {groupMetricBlocks}
            </div>
            {timeRangeControls}
          </div>
        )}

        <div className="mt-4">
          <ProbabilityChart
            chartData={chartData}
            yDomain={yDomain}
            annotations={annotations}
            timeRange={timeRange}
          />
        </div>
      </motion.div>

      {showChartOrderbookDivider && showOrderbook ? (
        <div
          className="h-px w-full shrink-0 bg-[#EBEBEB] xl:h-auto xl:w-px xl:self-stretch"
          aria-hidden
        />
      ) : null}

      <div className="hidden md:block">
        <OrderbookPanel
          visible={showOrderbook}
          tokenId={tokenId}
          className="min-h-0 w-full"
          orderbookClassName={borderless ? orderbookBorderlessClass : undefined}
        />
      </div>

      <div className="md:hidden">
        <div className="overflow-hidden rounded-[12px] border border-[#EBEBEB] bg-white">
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3 text-left"
            aria-expanded={orderbookExpanded}
            aria-controls="team-trade-mobile-orderbook"
            onClick={() => setOrderbookExpanded((current) => !current)}
          >
            <span className="text-base font-[500] leading-[19px] text-black">
              {t("orderbook")}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-[#909090] transition-transform",
                orderbookExpanded && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>

          {orderbookExpanded ? (
            <div
              id="team-trade-mobile-orderbook"
              className="border-t border-[#EBEBEB]"
            >
              <OrderbookPanel
                visible
                tokenId={tokenId}
                variant="mirror"
                className="min-h-0 w-full"
              />
            </div>
          ) : null}
        </div>
      </div>
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
      <p className="m-0 mt-1 md:block hidden text-sm font-[500] leading-[17px] text-[#909090]">
        {label}
      </p>
    </div>
  );
}
