"use client";

import { useTranslations } from "next-intl";
import {
  createContext,
  useContext,
  useMemo,
  type ReactElement,
  type ReactNode
} from "react";
import {
  CartesianGrid,
  Customized,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps
} from "recharts";

import { formatChartProbability } from "@/components/home/market-formatters";
import {
  formatChartTimestampClockLabel,
  formatGoalEventTime,
} from "@/lib/market/match-display";
import {
  formatGameChartXAxisTick,
  getFixtureChartYDomain,
} from "@/lib/market/fixture-probability-chart";
import {
  LIVE_MATCH_CHART_AXIS_MAX_ELAPSED_SECONDS,
  resolveLiveChartAxisTicks
} from "@/lib/market/live-fixture-probability-chart";
import type {
  GameFixtureChartPoint,
  GameFixtureChartTimeRange,
  GameMatchChartEvent,
} from "@/types/market";
import {
  GoalEventMarkerChartProvider,
  GoalEventMarkerCustomized,
} from "@/views/trade/game-probability/goal-event-marker-layer";

const CHART_COLORS = {
  home: "#3168FF",
  draw: "#D9D9D9",
  away: "#F4B600",
  grid: "#EBEBEB",
  muted: "#909090"
} as const;

const SERIES = [
  { key: "home" as const, color: CHART_COLORS.home },
  { key: "draw" as const, color: CHART_COLORS.draw },
  { key: "away" as const, color: CHART_COLORS.away }
] as const;

const END_LABEL_RIGHT_INSET = 10;
const END_LABEL_ESTIMATED_WIDTH = 130;
const END_LABEL_GUTTER = END_LABEL_RIGHT_INSET + END_LABEL_ESTIMATED_WIDTH + 8;
const END_LABEL_SLOT_FRACTIONS: Record<(typeof SERIES)[number]["key"], number> =
  {
    home: 1 / 6,
    draw: 1 / 2,
    away: 5 / 6
  };

interface ChartRow extends GameFixtureChartPoint {
  chartLabel: string;
}

interface ChartCustomizedProps {
  offset?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  width?: number;
  height?: number;
}

type EndLabelChartConfig = {
  chartData: ChartRow[];
  seriesLabels: Record<(typeof SERIES)[number]["key"], string>;
};

const EndLabelChartContext = createContext<EndLabelChartConfig | null>(null);

function EndLabelChartProvider({
  value,
  children
}: {
  value: EndLabelChartConfig;
  children: ReactNode;
}) {
  return (
    <EndLabelChartContext.Provider value={value}>
      {children}
    </EndLabelChartContext.Provider>
  );
}

function resolvePlotRightAnchorX(
  width: number | undefined,
  offset: ChartCustomizedProps["offset"]
): number | undefined {
  if (!width) {
    return undefined;
  }

  const plotRight = width - (offset?.right ?? 0);
  return plotRight - END_LABEL_RIGHT_INSET;
}

function resolveFixedLabelSlotY(
  seriesKey: (typeof SERIES)[number]["key"],
  offset: ChartCustomizedProps["offset"],
  height: number | undefined
): number | undefined {
  if (!height) {
    return undefined;
  }

  const top = offset?.top ?? 0;
  const bottom = offset?.bottom ?? 0;
  const plotHeight = height - top - bottom;
  const fraction = END_LABEL_SLOT_FRACTIONS[seriesKey];

  return top + plotHeight * fraction;
}

function EndLabelMarker({
  anchorX,
  slotY,
  name,
  probability,
  series
}: {
  anchorX: number;
  slotY: number;
  name: string;
  probability: number | undefined;
  series: (typeof SERIES)[number];
}): ReactElement<SVGElement> {
  const probabilityLabel =
    typeof probability === "number" ? formatChartProbability(probability) : "—";
  const nameY = slotY - 14;
  const valueY = slotY + 14;

  return (
    <text textAnchor="end">
      <tspan
        x={anchorX}
        y={nameY}
        fill={series.color}
        fontSize={14}
        fontWeight={400}
      >
        {name}
      </tspan>
      <tspan
        x={anchorX}
        y={valueY}
        fill={series.color}
        fontSize={26}
        fontWeight={600}
      >
        {probabilityLabel}
      </tspan>
    </text>
  );
}

function EndLineDot({
  cx,
  cy,
  index,
  dataLength,
  series
}: {
  cx?: number;
  cy?: number;
  index?: number;
  dataLength: number;
  series: (typeof SERIES)[number];
}): ReactElement<SVGElement> {
  if (index !== dataLength - 1 || cx === undefined || cy === undefined) {
    return <g />;
  }

  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill={series.color} fillOpacity={0.2} />
      <circle cx={cx} cy={cy} r={5} fill={series.color} />
    </g>
  );
}

function EndLabelLayer({
  offset,
  width,
  height,
  chartData,
  seriesLabels
}: ChartCustomizedProps & EndLabelChartConfig) {
  const anchorX = resolvePlotRightAnchorX(width, offset);
  const latestRow = chartData.at(-1);

  if (anchorX === undefined || !latestRow) {
    return null;
  }

  return (
    <g className="pointer-events-none">
      {SERIES.map((series) => {
        const slotY = resolveFixedLabelSlotY(series.key, offset, height);

        if (slotY === undefined || !Number.isFinite(slotY)) {
          return null;
        }

        return (
          <EndLabelMarker
            key={series.key}
            anchorX={anchorX}
            slotY={slotY}
            name={seriesLabels[series.key]}
            probability={latestRow[series.key]}
            series={series}
          />
        );
      })}
    </g>
  );
}

/** Stable Recharts Customized component — do not pass an inline render function. */
function EndLabelCustomized(chartProps: Record<string, unknown>) {
  const config = useContext(EndLabelChartContext);

  if (!config) {
    return null;
  }

  return (
    <EndLabelLayer
      offset={chartProps.offset as ChartCustomizedProps["offset"]}
      width={chartProps.width as number | undefined}
      height={chartProps.height as number | undefined}
      {...config}
    />
  );
}

export interface GameProbabilityChartProps {
  data: GameFixtureChartPoint[];
  homeLabel?: string;
  drawLabel?: string;
  awayLabel?: string;
  mode?: "historical" | "live";
  timeRange?: GameFixtureChartTimeRange;
  events?: GameMatchChartEvent[];
  maxElapsedSeconds?: number;
  kickoffAt?: string;
  homeCode?: string;
  awayCode?: string;
}

export function GameProbabilityChart({
  data,
  homeLabel,
  drawLabel,
  awayLabel,
  mode = "historical",
  timeRange = "all",
  events = [],
  maxElapsedSeconds = 0,
  kickoffAt,
  homeCode,
  awayCode,
}: GameProbabilityChartProps) {
  const t = useTranslations("trade");
  const isLive = mode === "live";
  const formatLiveAxisTick = (value: number) => {
    const safeSeconds = Math.max(0, Math.floor(value));
    const minutes = Math.floor(safeSeconds / 60);

    if (minutes === 45) {
      return t("chartHalfTimeAxisLabel");
    }

    return `${minutes}'`;
  };

  const seriesLabels = useMemo(
    () => ({
      home: homeLabel ?? t("home"),
      draw: drawLabel ?? t("draw"),
      away: awayLabel ?? t("away")
    }),
    [awayLabel, drawLabel, homeLabel, t]
  );

  const chartData = useMemo<ChartRow[]>(
    () =>
      data.map((point) => ({
        ...point,
        chartLabel: point.label
      })),
    [data]
  );

  const yDomain = useMemo(() => getFixtureChartYDomain(data), [data]);
  const endLabelChartConfig = useMemo(
    () => ({
      chartData,
      seriesLabels
    }),
    [chartData, seriesLabels]
  );
  const dataLength = chartData.length;

  const resolvedMaxElapsed = useMemo(() => {
    if (!isLive) {
      return 0;
    }

    if (maxElapsedSeconds > 0) {
      return maxElapsedSeconds;
    }

    return Math.max(
      ...data.map((point) => point.elapsedSeconds ?? 0),
      LIVE_MATCH_CHART_AXIS_MAX_ELAPSED_SECONDS
    );
  }, [data, isLive, maxElapsedSeconds]);

  const goalMarkerConfig = useMemo(
    () => ({
      events,
      maxElapsedSeconds: resolvedMaxElapsed,
      homeCode,
      homeName: seriesLabels.home,
      awayCode,
      awayName: seriesLabels.away,
    }),
    [
      awayCode,
      events,
      homeCode,
      resolvedMaxElapsed,
      seriesLabels.away,
      seriesLabels.home,
    ]
  );

  if (data.length === 0) {
    return null;
  }

  const chart = (
    <LineChart
      data={chartData}
      margin={{
        top: 56,
        right: 8,
        left: 4,
        bottom: isLive ? 36 : 4
      }}
    >
      <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
      <XAxis
        type={isLive ? "number" : "category"}
        dataKey={isLive ? "elapsedSeconds" : "timestamp"}
        domain={isLive ? [0, resolvedMaxElapsed] : undefined}
        ticks={
          isLive ? resolveLiveChartAxisTicks(resolvedMaxElapsed) : undefined
        }
        tick={{ fill: CHART_COLORS.muted, fontSize: 14, dy: 6 }}
        axisLine={false}
        tickLine={false}
        minTickGap={24}
        padding={{ left: 0, right: END_LABEL_GUTTER }}
        tickFormatter={
          isLive
            ? formatLiveAxisTick
            : (value: string) => formatGameChartXAxisTick(value, timeRange)
        }
      />
      <YAxis
        domain={yDomain}
        orientation="right"
        tick={{ fill: CHART_COLORS.muted, fontSize: 14 }}
        axisLine={false}
        tickLine={false}
        tickFormatter={(value: number) => `${value}%`}
        width={44}
      />
      <Tooltip
        content={
          <ChartTooltip
            seriesLabels={seriesLabels}
            isLive={isLive}
            kickoffAt={kickoffAt}
            timeRange={timeRange}
          />
        }
      />
      {SERIES.map((series) => (
        <Line
          key={series.key}
          type="monotone"
          dataKey={series.key}
          stroke={series.color}
          strokeWidth={1}
          isAnimationActive={false}
          dot={(props) => (
            <EndLineDot {...props} dataLength={dataLength} series={series} />
          )}
          activeDot={{
            r: 5,
            fill: series.color,
            stroke: `${series.color}33`,
            strokeWidth: 3
          }}
        />
      ))}
      <Customized component={EndLabelCustomized} />
      {isLive ? <Customized component={GoalEventMarkerCustomized} /> : null}
    </LineChart>
  );

  const chartBody = (
    <ResponsiveContainer width="100%" height="100%">
      {chart}
    </ResponsiveContainer>
  );

  return (
    <div className="h-[280px] w-full min-h-[240px] sm:h-[320px] xl:h-[340px]">
      <div className="flex h-full gap-4">
        <div className="min-w-0 flex-1">
          <EndLabelChartProvider value={endLabelChartConfig}>
            {isLive ? (
              <GoalEventMarkerChartProvider value={goalMarkerConfig}>
                {chartBody}
              </GoalEventMarkerChartProvider>
            ) : (
              chartBody
            )}
          </EndLabelChartProvider>
        </div>
      </div>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  seriesLabels,
  isLive,
  kickoffAt,
  timeRange,
}: TooltipProps<number, string> & {
  seriesLabels: Record<(typeof SERIES)[number]["key"], string>;
  isLive: boolean;
  kickoffAt?: string;
  timeRange: GameFixtureChartTimeRange;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload as ChartRow | undefined;
  const timeLabel =
    isLive && typeof label === "number"
      ? formatGoalEventTime(label)
      : isLive && point?.timestamp
        ? formatChartTimestampClockLabel(point.timestamp)
        : formatGameChartXAxisTick(String(label ?? ""), timeRange);

  return (
    <div className="rounded-xl border border-[#EBEBEB] bg-white px-3 py-2 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
      <p className="m-0 mb-1 text-sm font-[400] leading-[17px] text-[#909090]">
        {timeLabel}
      </p>
      {payload.map((entry) => {
        const series = SERIES.find((item) => item.key === entry.dataKey);

        return (
          <p
            key={String(entry.dataKey)}
            className="m-0 text-[12px] font-[400] leading-[20px]"
            style={{ color: entry.color }}
          >
            {series ? seriesLabels[series.key] : entry.dataKey}:{" "}
            {typeof entry.value === "number"
              ? formatChartProbability(entry.value)
              : "—"}
          </p>
        );
      })}
    </div>
  );
}
