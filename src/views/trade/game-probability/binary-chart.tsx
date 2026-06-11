"use client";

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

import {
  formatChartProbability,
  formatProbability
} from "@/components/home/market-formatters";
import {
  formatChartTimestampClockLabel,
  formatGoalEventTime,
  formatMatchMinuteAxisLabel,
} from "@/lib/market/match-display";
import {
  formatGameChartXAxisTick,
  getBinaryFixtureChartYDomain,
} from "@/lib/market/fixture-probability-chart";
import {
  LIVE_MATCH_CHART_AXIS_MAX_ELAPSED_SECONDS,
  resolveLiveChartAxisTicks,
} from "@/lib/market/live-fixture-probability-chart";
import type {
  GameFixtureBinaryChartPoint,
  GameFixtureChartTimeRange,
  GameMatchChartEvent,
} from "@/types/market";
import {
  GoalEventMarkerChartProvider,
  GoalEventMarkerCustomized,
} from "@/views/trade/game-probability/goal-event-marker-layer";

const CHART_COLORS = {
  primary: "#3168FF",
  secondary: "#F4B600",
  grid: "#EBEBEB",
  muted: "#909090"
} as const;

const END_LABEL_RIGHT_INSET = 10;
const END_LABEL_ESTIMATED_WIDTH = 100;
const END_LABEL_GUTTER = END_LABEL_RIGHT_INSET + END_LABEL_ESTIMATED_WIDTH + 8;

interface ChartRow extends GameFixtureBinaryChartPoint {
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

type BinarySeriesKey = "primary" | "secondary";

type BinarySeriesItem = {
  key: BinarySeriesKey;
  color: string;
  label: string;
};

type EndLabelChartConfig = {
  chartData: ChartRow[];
  series: BinarySeriesItem[];
  yDomain: [number, number];
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

function resolveValuePlotY(
  value: number | undefined,
  yDomain: [number, number],
  offset: ChartCustomizedProps["offset"],
  height: number | undefined
): number | undefined {
  if (value === undefined || !height || !Number.isFinite(value)) {
    return undefined;
  }

  const top = offset?.top ?? 0;
  const bottom = offset?.bottom ?? 0;
  const plotHeight = height - top - bottom;
  const [min, max] = yDomain;

  if (plotHeight <= 0 || max === min) {
    return top + plotHeight / 2;
  }

  const ratio = (value - min) / (max - min);
  return top + plotHeight * (1 - ratio);
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
  series: BinarySeriesItem;
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
  series: BinarySeriesItem;
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
  series,
  yDomain
}: ChartCustomizedProps & EndLabelChartConfig) {
  const anchorX = resolvePlotRightAnchorX(width, offset);
  const latestRow = chartData.at(-1);

  if (anchorX === undefined || !latestRow) {
    return null;
  }

  return (
    <g className="pointer-events-none">
      {series.map((item) => {
        const slotY = resolveValuePlotY(
          latestRow[item.key],
          yDomain,
          offset,
          height
        );

        if (slotY === undefined || !Number.isFinite(slotY)) {
          return null;
        }

        return (
          <EndLabelMarker
            key={item.key}
            anchorX={anchorX}
            slotY={slotY}
            name={item.label}
            probability={latestRow[item.key]}
            series={item}
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

export interface GameBinaryProbabilityChartProps {
  data: GameFixtureBinaryChartPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  mode?: "historical" | "live";
  timeRange?: GameFixtureChartTimeRange;
  events?: GameMatchChartEvent[];
  maxElapsedSeconds?: number;
  kickoffAt?: string;
  homeCode?: string;
  awayCode?: string;
}

export function GameBinaryProbabilityChart({
  data,
  primaryLabel = "Primary",
  secondaryLabel = "Secondary",
  primaryColor = CHART_COLORS.primary,
  secondaryColor = CHART_COLORS.secondary,
  mode = "historical",
  timeRange = "all",
  events = [],
  maxElapsedSeconds = 0,
  kickoffAt,
  homeCode,
  awayCode,
}: GameBinaryProbabilityChartProps) {
  const isLive = mode === "live";

  const series = useMemo(
    () => [
      { key: "primary" as const, color: primaryColor, label: primaryLabel },
      { key: "secondary" as const, color: secondaryColor, label: secondaryLabel }
    ],
    [primaryColor, primaryLabel, secondaryColor, secondaryLabel]
  );

  const chartData = useMemo<ChartRow[]>(
    () =>
      data.map((point) => ({
        ...point,
        chartLabel: point.label
      })),
    [data]
  );

  const yDomain = useMemo(() => getBinaryFixtureChartYDomain(data), [data]);
  const endLabelChartConfig = useMemo(
    () => ({
      chartData,
      series,
      yDomain
    }),
    [chartData, series, yDomain]
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
      homeName: primaryLabel,
      awayCode,
      awayName: secondaryLabel,
    }),
    [
      awayCode,
      events,
      homeCode,
      primaryLabel,
      resolvedMaxElapsed,
      secondaryLabel,
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
            ? (value: number) => formatMatchMinuteAxisLabel(value)
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
          <BinaryChartTooltip
            series={series}
            isLive={isLive}
            kickoffAt={kickoffAt}
            timeRange={timeRange}
          />
        }
      />
      {series.map((item) => (
        <Line
          key={item.key}
          type="monotone"
          dataKey={item.key}
          stroke={item.color}
          strokeWidth={2}
          isAnimationActive={false}
          dot={(props) => (
            <EndLineDot {...props} dataLength={dataLength} series={item} />
          )}
          activeDot={{
            r: 5,
            fill: item.color,
            stroke: `${item.color}33`,
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

function BinaryChartTooltip({
  active,
  payload,
  label,
  series,
  isLive,
  kickoffAt,
  timeRange,
}: TooltipProps<number, string> & {
  series: Array<{ key: "primary" | "secondary"; color: string; label: string }>;
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
      <p className="m-0 mb-1 text-sm font-[500] leading-[17px] text-[#909090]">
        {timeLabel}
      </p>
      {payload.map((entry) => {
        const item = series.find(
          (seriesItem) => seriesItem.key === entry.dataKey
        );

        return (
          <p
            key={String(entry.dataKey)}
            className="m-0 text-sm font-[500] leading-[17px]"
            style={{ color: entry.color }}
          >
            {item?.label ?? entry.dataKey}:{" "}
            {typeof entry.value === "number"
              ? formatProbability(entry.value)
              : "—"}
          </p>
        );
      })}
    </div>
  );
}
