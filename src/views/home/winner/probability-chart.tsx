"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactElement,
  type ReactNode
} from "react";

import { useAnalyticsImpression } from "@/hooks/analytics/use-analytics-impression";
import {
  Customized,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps
} from "recharts";

import { useTranslations } from "next-intl";

import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";

import { formatProbability } from "@/components/home/market-formatters";
import { TeamFlag } from "@/components/teams/team-flag";
import { useDevice } from "@/hooks/common/use-device";
import { useProbabilityChart } from "@/hooks/market/use-probability-chart";
import { cn } from "@/lib/cn";
import {
  buildWinnerChartData,
  filterWinnerChartByRange,
  formatWinnerChartTooltipDate,
  formatWinnerChartXAxisTick,
  getLatestSeriesValues,
  getWinnerChartYDomain,
  type WinnerChartSeriesConfig,
  type WinnerChartTimeRange
} from "@/lib/market/winner-probability-chart";
import type {
  ProbabilityHistoryPoint,
  TeamMarketSnapshot
} from "@/types/market";

export interface WinnerProbabilityChartProps {
  className?: string;
  teams: TeamMarketSnapshot[];
  probabilityHistory?: ProbabilityHistoryPoint[];
  /** When true, omit the built-in section title (e.g. parent panel provides the heading). */
  hideTitle?: boolean;
  topTeamCount?: number;
  /** When true, show x-axis labels and hover tooltip (e.g. team detail panel). */
  showAxisTooltip?: boolean;
}

const END_DOT_FLAG_SIZE = 12;

interface ChartCustomizedProps {
  formattedGraphicalItems?: Array<{
    item?: {
      type?: { displayName?: string };
      props?: { dataKey?: string };
    };
    props?: { points?: Array<{ x: number; y: number }> };
  }>;
  offset?: { top?: number; right?: number; bottom?: number; left?: number };
  width?: number;
  height?: number;
}

type MobileFlagChartConfig = {
  series: WinnerChartSeriesConfig[];
};

const MobileFlagChartContext = createContext<MobileFlagChartConfig | null>(null);

function MobileFlagChartProvider({
  value,
  children
}: {
  value: MobileFlagChartConfig;
  children: ReactNode;
}) {
  return (
    <MobileFlagChartContext.Provider value={value}>
      {children}
    </MobileFlagChartContext.Provider>
  );
}

function getLineSeriesPoints(
  formattedGraphicalItems: ChartCustomizedProps["formattedGraphicalItems"],
  dataKey: string
): Array<{ x: number; y: number }> {
  const lineItem = formattedGraphicalItems?.find(
    (item) =>
      item?.item?.type?.displayName === "Line" &&
      item?.item?.props?.dataKey === dataKey
  );

  return lineItem?.props?.points ?? [];
}

function resolvePlotCenterX(
  width: number | undefined,
  offset: ChartCustomizedProps["offset"]
): number | undefined {
  if (!width) {
    return undefined;
  }

  const left = offset?.left ?? 0;
  const right = offset?.right ?? 0;

  return left + (width - left - right) / 2;
}

function MobileLineFlagMarker({
  cx,
  cy,
  teamCode,
  teamName
}: {
  cx: number;
  cy: number;
  teamCode: string;
  teamName: string;
}): ReactElement<SVGElement> {
  return (
    <foreignObject
      x={cx - END_DOT_FLAG_SIZE / 2}
      y={cy - END_DOT_FLAG_SIZE / 2}
      width={END_DOT_FLAG_SIZE}
      height={END_DOT_FLAG_SIZE}
      className="overflow-visible"
    >
      <div className="flex h-full w-full items-center justify-center">
        <TeamFlag
          code={teamCode}
          name={teamName}
          className="!h-[12px] !w-[12px] rounded-[2px]"
        />
      </div>
    </foreignObject>
  );
}

function MobileLineFlagLayer({
  formattedGraphicalItems,
  offset,
  width,
  series
}: ChartCustomizedProps & MobileFlagChartConfig) {
  const centerX = resolvePlotCenterX(width, offset);

  if (centerX === undefined) {
    return null;
  }

  return (
    <g className="pointer-events-none">
      {series.map((item) => {
        const points = getLineSeriesPoints(formattedGraphicalItems, item.dataKey);

        if (points.length === 0) {
          return null;
        }

        const anchorPoint = points.reduce((closest, point) =>
          Math.abs(point.x - centerX) < Math.abs(closest.x - centerX)
            ? point
            : closest
        );

        if (!Number.isFinite(anchorPoint.x) || !Number.isFinite(anchorPoint.y)) {
          return null;
        }

        return (
          <MobileLineFlagMarker
            key={item.dataKey}
            cx={anchorPoint.x}
            cy={anchorPoint.y}
            teamCode={item.teamCode}
            teamName={item.label}
          />
        );
      })}
    </g>
  );
}

/** Stable Recharts Customized component — do not pass an inline render function. */
function MobileLineFlagCustomized(chartProps: Record<string, unknown>) {
  const config = useContext(MobileFlagChartContext);

  if (!config) {
    return null;
  }

  return (
    <MobileLineFlagLayer
      offset={chartProps.offset as ChartCustomizedProps["offset"]}
      width={chartProps.width as number | undefined}
      height={chartProps.height as number | undefined}
      formattedGraphicalItems={
        chartProps.formattedGraphicalItems as ChartCustomizedProps["formattedGraphicalItems"]
      }
      {...config}
    />
  );
}

function renderEndDot(
  dataLength: number,
  color: string
): (props: {
  cx?: number;
  cy?: number;
  index?: number;
}) => ReactElement<SVGElement> {
  return function EndDot({ cx, cy, index }) {
    if (index !== dataLength - 1 || cx === undefined || cy === undefined) {
      return <g />;
    }

    return <circle cx={cx} cy={cy} r={6} fill={color} stroke={color} />;
  };
}

export function WinnerProbabilityChart({
  className,
  teams,
  probabilityHistory,
  hideTitle = false,
  topTeamCount = 8,
  showAxisTooltip = false
}: WinnerProbabilityChartProps) {
  const t = useTranslations("home");
  const isMobile = useDevice();
  const timeRange = "all";
  const shouldFetch = probabilityHistory === undefined;

  const {
    points: fetchedPoints,
    status: fetchStatus
  } = useProbabilityChart({
    kind: "winner",
    teams,
    topCount: topTeamCount,
    pollIntervalMs: 5000,
    enabled: shouldFetch
  });

  const formatXAxisTick = (value: string) =>
    formatWinnerChartXAxisTick(value, timeRange);

  const effectiveHistory = shouldFetch
    ? fetchStatus === "ready"
      ? fetchedPoints
      : []
    : probabilityHistory;

  const { series, points } = useMemo(
    () => buildWinnerChartData(teams, effectiveHistory, topTeamCount),
    [teams, effectiveHistory, topTeamCount]
  );

  const chartData = useMemo(
    () => filterWinnerChartByRange(points, timeRange),
    [points, timeRange]
  );

  const yAxis = useMemo(
    () => getWinnerChartYDomain(chartData, series),
    [chartData, series]
  );

  const legendValues = useMemo(
    () => getLatestSeriesValues(chartData, series),
    [chartData, series]
  );

  const mobileFlagConfig = useMemo<MobileFlagChartConfig | null>(
    () => (isMobile ? { series } : null),
    [isMobile, series]
  );
  const showChart = !shouldFetch || fetchStatus === "ready";
  const chartRef = useAnalyticsImpression<HTMLElement>({
    eventName: "chart_viewed",
    dedupeKey: "chart:winner_probability",
    enabled: showChart,
    payload: {
      chartId: "winner_probability",
      section: "winner_chart"
    }
  });

  return (
    <section
      ref={chartRef}
      className={cn(
        "min-w-0 rounded-xl border border-[#EBEBEB] bg-white px-3 md:px-5 pb-5 pt-4",
        className
      )}
      aria-label={t("worldCupWinnerProbabilityChartAria")}
    >
      <div
        className={cn(
          "flex flex-wrap items-start flex-col md:flex-row justify-between gap-3",
          hideTitle ? "pr-0" : "pr-[6px]"
        )}
      >
        <h2 className="text-[16px] md:text-[20px] font-[500] leading-6 text-black">
          {t("worldCupWinnerProbability")}
        </h2>
      </div>

      {showChart ? (
        <ChartLegend items={legendValues} className="mt-3 hidden md:flex" />
      ) : null}

      {!showChart && fetchStatus === "loading" ? (
        <p className="mt-4 py-8 text-center text-sm text-[#909090]">
          {t("loadingProbabilityHistory")}
        </p>
      ) : !showChart && fetchStatus === "error" ? (
        <p className="mt-4 py-8 text-center text-sm text-[#909090]">
          {t("unableToLoadProbabilityHistory")}
        </p>
      ) : !showChart && fetchStatus === "empty" ? (
        <p className="mt-4 py-8 text-center text-sm text-[#909090]">
          {t("marketTokenUnavailable")}
        </p>
      ) : (
        <div className="mt-4 h-[190px] w-full">
          {mobileFlagConfig ? (
            <MobileFlagChartProvider value={mobileFlagConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <WinnerLineChartBody
                  chartData={chartData}
                  series={series}
                  yAxis={yAxis}
                  showAxisTooltip={showAxisTooltip}
                  formatXAxisTick={formatXAxisTick}
                  isMobile={isMobile}
                />
              </ResponsiveContainer>
            </MobileFlagChartProvider>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <WinnerLineChartBody
                chartData={chartData}
                series={series}
                yAxis={yAxis}
                showAxisTooltip={showAxisTooltip}
                formatXAxisTick={formatXAxisTick}
                isMobile={isMobile}
              />
            </ResponsiveContainer>
          )}
        </div>
      )}
    </section>
  );
}

function WinnerLineChartBody({
  chartData,
  series,
  yAxis,
  showAxisTooltip,
  formatXAxisTick,
  isMobile,
  width,
  height
}: {
  chartData: ReturnType<typeof filterWinnerChartByRange>;
  series: WinnerChartSeriesConfig[];
  yAxis: ReturnType<typeof getWinnerChartYDomain>;
  showAxisTooltip: boolean;
  formatXAxisTick: (value: string) => string;
  isMobile: boolean;
  width?: number;
  height?: number;
}) {
  return (
    <LineChart
      width={width}
      height={height}
      data={chartData}
      margin={{
        top: 8,
        right: showAxisTooltip ? 12 : 0,
        left: 8,
        bottom: showAxisTooltip ? 8 : 0
      }}
    >
      {showAxisTooltip ? (
        <XAxis
          dataKey="date"
          padding={{ left: 0, right: 6 }}
          tick={{
            fill: "#909090",
            fontSize: 14,
            dy: 6
          }}
          tickLine={false}
          axisLine={false}
          minTickGap={32}
          tickFormatter={formatXAxisTick}
        />
      ) : (
        <XAxis dataKey="date" hide />
      )}
      <YAxis
        orientation={showAxisTooltip ? "left" : "right"}
        domain={yAxis.domain}
        ticks={yAxis.ticks}
        tick={{ fill: "#909090", fontSize: 14 }}
        tickFormatter={(value: number) => `${value}%`}
        tickLine={false}
        axisLine={false}
        width={40}
      />
      <Tooltip
        cursor={{ stroke: "#EBEBEB", strokeWidth: 1 }}
        content={<WinnerChartTooltip series={series} />}
      />
      {series.map((item) => (
        <Line
          key={item.dataKey}
          type="monotone"
          dataKey={item.dataKey}
          stroke={item.color}
          strokeWidth={1}
          dot={isMobile ? false : renderEndDot(chartData.length, item.color)}
          activeDot={
            isMobile
              ? false
              : {
                  r: 5,
                  fill: item.color,
                  stroke: item.color,
                  strokeWidth: 1
                }
          }
          isAnimationActive={false}
        />
      ))}
      {isMobile ? <Customized component={MobileLineFlagCustomized} /> : null}
    </LineChart>
  );
}

function ChartLegend({
  items,
  className
}: {
  items: ReturnType<typeof getLatestSeriesValues>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "md:flex md:flex-wrap gap-x-8 gap-y-2 grid grid-cols-2",
        className
      )}
    >
      {items.map((item) => (
        <ChartLegendItem key={item.teamId} item={item} />
      ))}
    </div>
  );
}

function WinnerChartTooltip({
  active,
  payload,
  label,
  series
}: TooltipProps<number, string> & {
  series: WinnerChartSeriesConfig[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const dateLabel = typeof label === "string" ? label : String(label ?? "");

  return (
    <div className="rounded-xl border border-[#EBEBEB] bg-white px-3 py-2 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
      <p className="m-0 mb-1 text-sm font-[400] leading-[17px] text-[#909090]">
        {formatWinnerChartTooltipDate(dateLabel)}
      </p>
      {payload.map((entry) => {
        const item = series.find(
          (seriesItem) => seriesItem.dataKey === entry.dataKey
        );

        return (
          <WinnerChartTooltipRow
            key={String(entry.dataKey)}
            teamCode={item?.teamCode}
            fallbackLabel={item?.label ?? String(entry.dataKey)}
            color={entry.color}
            value={
              typeof entry.value === "number"
                ? formatProbability(entry.value)
                : "—"
            }
          />
        );
      })}
    </div>
  );
}

function WinnerChartTooltipRow({
  teamCode,
  fallbackLabel,
  color,
  value
}: {
  teamCode?: string;
  fallbackLabel: string;
  color?: string;
  value: string;
}) {
  const teamDisplayName = useLocalizedTeamName(teamCode, fallbackLabel);

  return (
    <p
      className="m-0 text-sm font-[400] leading-[24px]"
      style={{ color }}
    >
      {teamDisplayName}: {value}
    </p>
  );
}

function ChartLegendItem({
  item
}: {
  item: ReturnType<typeof getLatestSeriesValues>[number];
}) {
  const teamDisplayName = useLocalizedTeamName(item.teamCode, item.label);

  return (
    <div className="flex items-center gap-2 text-[14px] leading-[17px]">
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: item.color }}
        aria-hidden="true"
      />
      <span className="text-[#909090]">{teamDisplayName}</span>
      <span className="font-[500] text-black">
        {formatProbability(item.value)}
      </span>
    </div>
  );
}
