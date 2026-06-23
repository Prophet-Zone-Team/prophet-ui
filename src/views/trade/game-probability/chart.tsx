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
import { useDevice } from "@/hooks/common/use-device";
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
  mapLiveFixtureChartPointsToAxis,
  resolveLiveChartAxisTicksWithBreaks,
  resolveLiveChartMaxAxisSeconds,
  resolveMatchClockFromAxisSeconds,
  type ResolveMatchClockSecondsOptions
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
const END_LABEL_SLOT_TOP = 1 / 6;
const END_LABEL_SLOT_MIDDLE = 1 / 2;
const END_LABEL_SLOT_BOTTOM = 5 / 6;

interface ChartRow extends GameFixtureChartPoint {
  chartLabel: string;
  axisSeconds?: number;
  matchClockSeconds?: number;
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
  nameFontSize: number;
  valueFontSize: number;
  nameOffsetY: number;
  valueOffsetY: number;
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

function resolveEndLabelProbability(
  probability: number | undefined
): number {
  return typeof probability === "number" && Number.isFinite(probability)
    ? probability
    : 0;
}

function resolveEndLabelSlotFractions(
  homeProbability: number | undefined,
  drawProbability: number | undefined,
  awayProbability: number | undefined
): Record<(typeof SERIES)[number]["key"], number> {
  const slotByRank = [
    END_LABEL_SLOT_TOP,
    END_LABEL_SLOT_MIDDLE,
    END_LABEL_SLOT_BOTTOM
  ] as const;
  const tieBreakOrder: Array<(typeof SERIES)[number]["key"]> = [
    "home",
    "draw",
    "away"
  ];

  const ranked = tieBreakOrder
    .map((key) => ({
      key,
      probability:
        key === "home"
          ? resolveEndLabelProbability(homeProbability)
          : key === "draw"
            ? resolveEndLabelProbability(drawProbability)
            : resolveEndLabelProbability(awayProbability)
    }))
    .sort((left, right) => {
      if (right.probability !== left.probability) {
        return right.probability - left.probability;
      }

      return (
        tieBreakOrder.indexOf(left.key) - tieBreakOrder.indexOf(right.key)
      );
    });

  const slots: Record<(typeof SERIES)[number]["key"], number> = {
    home: END_LABEL_SLOT_BOTTOM,
    draw: END_LABEL_SLOT_BOTTOM,
    away: END_LABEL_SLOT_BOTTOM
  };

  ranked.forEach((item, index) => {
    slots[item.key] = slotByRank[index] ?? END_LABEL_SLOT_MIDDLE;
  });

  return slots;
}

function resolveLabelSlotY(
  slotFraction: number,
  offset: ChartCustomizedProps["offset"],
  height: number | undefined
): number | undefined {
  if (!height) {
    return undefined;
  }

  const top = offset?.top ?? 0;
  const bottom = offset?.bottom ?? 0;
  const plotHeight = height - top - bottom;

  return top + plotHeight * slotFraction;
}

function EndLabelMarker({
  anchorX,
  slotY,
  name,
  probability,
  series,
  nameFontSize,
  valueFontSize,
  nameOffsetY,
  valueOffsetY
}: {
  anchorX: number;
  slotY: number;
  name: string;
  probability: number | undefined;
  series: (typeof SERIES)[number];
  nameFontSize: number;
  valueFontSize: number;
  nameOffsetY: number;
  valueOffsetY: number;
}): ReactElement<SVGElement> {
  const probabilityLabel =
    typeof probability === "number" ? formatChartProbability(probability) : "—";
  const nameY = slotY - nameOffsetY;
  const valueY = slotY + valueOffsetY;

  return (
    <text textAnchor="end">
      <tspan
        x={anchorX}
        y={nameY}
        fill={series.color}
        fontSize={nameFontSize}
        fontWeight={400}
      >
        {name}
      </tspan>
      <tspan
        x={anchorX}
        y={valueY}
        fill={series.color}
        fontSize={valueFontSize}
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
  seriesLabels,
  nameFontSize,
  valueFontSize,
  nameOffsetY,
  valueOffsetY
}: ChartCustomizedProps & EndLabelChartConfig) {
  const anchorX = resolvePlotRightAnchorX(width, offset);
  const latestRow = chartData.at(-1);

  if (anchorX === undefined || !latestRow) {
    return null;
  }

  const slotFractions = resolveEndLabelSlotFractions(
    latestRow.home,
    latestRow.draw,
    latestRow.away
  );

  return (
    <g className="pointer-events-none">
      {SERIES.map((series) => {
        const slotY = resolveLabelSlotY(
          slotFractions[series.key],
          offset,
          height
        );

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
            nameFontSize={nameFontSize}
            valueFontSize={valueFontSize}
            nameOffsetY={nameOffsetY}
            valueOffsetY={valueOffsetY}
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
  matchPeriod?: string;
  matchClockElapsedSeconds?: number;
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
  matchPeriod,
  matchClockElapsedSeconds,
  homeCode,
  awayCode,
}: GameProbabilityChartProps) {
  const t = useTranslations("trade");
  const isMobile = useDevice();
  const axisFontSize = isMobile ? 10 : 14;
  const endLabelNameFontSize = isMobile ? 10 : 14;
  const endLabelValueFontSize = isMobile ? 10 : 26;
  const endLabelNameOffsetY = isMobile ? 10 : 14;
  const endLabelValueOffsetY = isMobile ? 10 : 14;
  const isLive = mode === "live";
  const liveClockOptions = useMemo<ResolveMatchClockSecondsOptions>(
    () => ({
      matchPeriod,
      currentMatchClockSeconds: matchClockElapsedSeconds
    }),
    [matchClockElapsedSeconds, matchPeriod]
  );
  const formatLiveAxisTick = (value: number) => {
    const matchClockSeconds = resolveMatchClockFromAxisSeconds(value);
    const minutes = Math.floor(matchClockSeconds / 60);

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
    () => {
      if (!isLive) {
        return data.map((point) => ({
          ...point,
          chartLabel: point.label
        }));
      }

      return mapLiveFixtureChartPointsToAxis(data, liveClockOptions).map(
        (point) => ({
          ...point,
          chartLabel: point.label
        })
      );
    },
    [data, isLive, liveClockOptions]
  );

  const yDomain = useMemo(() => getFixtureChartYDomain(data), [data]);
  const endLabelChartConfig = useMemo(
    () => ({
      chartData,
      seriesLabels,
      nameFontSize: endLabelNameFontSize,
      valueFontSize: endLabelValueFontSize,
      nameOffsetY: endLabelNameOffsetY,
      valueOffsetY: endLabelValueOffsetY
    }),
    [
      chartData,
      endLabelNameFontSize,
      endLabelNameOffsetY,
      endLabelValueFontSize,
      endLabelValueOffsetY,
      seriesLabels
    ]
  );
  const dataLength = chartData.length;

  const resolvedMaxMatchClock = useMemo(() => {
    if (!isLive) {
      return 0;
    }

    if (maxElapsedSeconds > 0) {
      return maxElapsedSeconds;
    }

    return Math.max(
      ...chartData.map((point) => point.matchClockSeconds ?? 0),
      matchClockElapsedSeconds ?? 0,
      LIVE_MATCH_CHART_AXIS_MAX_ELAPSED_SECONDS
    );
  }, [chartData, isLive, matchClockElapsedSeconds, maxElapsedSeconds]);

  const resolvedMaxAxisSeconds = useMemo(
    () =>
      isLive ? resolveLiveChartMaxAxisSeconds(resolvedMaxMatchClock) : 0,
    [isLive, resolvedMaxMatchClock]
  );

  const goalMarkerConfig = useMemo(
    () => ({
      events,
      maxAxisSeconds: resolvedMaxAxisSeconds,
      homeCode,
      homeName: seriesLabels.home,
      awayCode,
      awayName: seriesLabels.away,
    }),
    [
      awayCode,
      events,
      homeCode,
      resolvedMaxAxisSeconds,
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
        dataKey={isLive ? "axisSeconds" : "timestamp"}
        domain={isLive ? [0, resolvedMaxAxisSeconds] : undefined}
        ticks={
          isLive
            ? resolveLiveChartAxisTicksWithBreaks(resolvedMaxMatchClock)
            : undefined
        }
        tick={{ fill: CHART_COLORS.muted, fontSize: axisFontSize, dy: 6 }}
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
        tick={{ fill: CHART_COLORS.muted, fontSize: axisFontSize }}
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
  const matchClockSeconds =
    isLive && typeof label === "number"
      ? resolveMatchClockFromAxisSeconds(label)
      : point?.matchClockSeconds;
  const timeLabel =
    isLive && typeof matchClockSeconds === "number"
      ? formatGoalEventTime(matchClockSeconds)
      : isLive && point?.timestamp
        ? formatChartTimestampClockLabel(point.timestamp)
        : formatGameChartXAxisTick(String(label ?? ""), timeRange);

  return (
    <div className="rounded-xl border border-[#EBEBEB] bg-white px-3 py-2 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
      <p className="m-0 mb-1 text-[10px] md:text-sm font-[400] leading-[17px] text-[#909090]">
        {timeLabel}
      </p>
      {payload.map((entry) => {
        const series = SERIES.find((item) => item.key === entry.dataKey);

        return (
          <p
            key={String(entry.dataKey)}
            className="m-0 text-[10px] md:text-[12px] font-[400] leading-[20px]"
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
