"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Customized,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps
} from "recharts";

import { TeamFlag } from "../../components/teams/TeamFlag";
import { formatProbability } from "../../components/home/market-formatters";
import {
  findAnnotationForChartPoint,
  type TeamChartMatchAnnotation
} from "../../lib/team/chartMatchAnnotations";
import type { ProbabilityHistoryPoint } from "../../types/market";

const CHART_LINE_COLOR = "#8AB956";
const CHART_FILL_TOP = "rgba(138, 185, 86, 0.3)";

interface TeamProbabilityChartProps {
  chartData: ProbabilityHistoryPoint[];
  yDomain: [number, number];
  annotations: TeamChartMatchAnnotation[];
}

interface ChartCustomizedProps {
  xAxisMap?: Record<
    string,
    {
      scale?: (value: string) => number;
    }
  >;
  yAxisMap?: Record<
    string,
    {
      scale?: (value: number) => number;
    }
  >;
  offset?: {
    left?: number;
    top?: number;
  };
}

export function TeamProbabilityChart({
  chartData,
  yDomain,
  annotations
}: TeamProbabilityChartProps) {
  const gradientId = useId().replace(/:/g, "");

  return (
    <div className="h-[267px] w-full min-h-[240px] sm:h-[280px] xl:h-[324px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 36, right: 12, left: 4, bottom: 4 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={CHART_FILL_TOP} />
              <stop offset="100%" stopColor="rgba(138, 185, 86, 0)" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#ebebeb" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#909090", fontSize: 14 }}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
            tickFormatter={formatChartDayTick}
          />
          <YAxis
            domain={yDomain}
            tick={{ fill: "#909090", fontSize: 14 }}
            tickFormatter={(value: number) => `${Number(value).toFixed(0)}%`}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            cursor={{ stroke: "#EBEBEB", strokeWidth: 1 }}
            content={
              <ChartTooltip annotations={annotations} />
            }
          />
          <Area
            type="monotone"
            dataKey="probability"
            stroke={CHART_LINE_COLOR}
            strokeWidth={1}
            fill={`url(#${gradientId})`}
            activeDot={{
              r: 5,
              fill: CHART_LINE_COLOR,
              stroke: "rgba(101, 175, 20, 0.2)",
              strokeWidth: 3
            }}
            dot={false}
          />
          <Customized
            component={(props: ChartCustomizedProps) => (
              <MatchMarkerLayer
                {...props}
                chartData={chartData}
                annotations={annotations}
              />
            )}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MatchMarkerLayer({
  xAxisMap,
  yAxisMap,
  offset,
  chartData,
  annotations
}: ChartCustomizedProps & {
  chartData: ProbabilityHistoryPoint[];
  annotations: TeamChartMatchAnnotation[];
}) {
  const xAxis = xAxisMap ? Object.values(xAxisMap)[0] : undefined;
  const yAxis = yAxisMap ? Object.values(yAxisMap)[0] : undefined;
  const xScale = xAxis?.scale;
  const yScale = yAxis?.scale;

  if (!xScale || !yScale || annotations.length === 0) {
    return null;
  }

  const left = offset?.left ?? 0;
  const top = offset?.top ?? 0;

  return (
    <foreignObject
      x={0}
      y={0}
      width="100%"
      height="100%"
      className="pointer-events-none overflow-visible"
    >
      <div className="relative h-full w-full">
        {annotations.map((annotation) => {
          const point = chartData[annotation.chartIndex];

          if (!point) {
            return null;
          }

          const x = xScale(point.date) + left;
          const y = yScale(point.probability) + top;

          if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return null;
          }

          return (
            <div key={annotation.matchId}>
              <div
                className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[rgba(101,175,20,0.2)] bg-[#8AB956]"
                style={{ left: x, top: y }}
              />
              <div
                className="absolute flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded border border-[#EBEBEB] bg-white px-1.5 py-1 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                style={{ left: x, top: y - 8 }}
              >
                <TeamFlag
                  code={annotation.homeCode}
                  name={annotation.homeName}
                  className="!h-4 !w-4 rounded-[2px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
                />
                <span className="text-sm font-[556] leading-[17px] text-[#909090]">
                  {annotation.scoreLabel}
                </span>
                <TeamFlag
                  code={annotation.awayCode}
                  name={annotation.awayName}
                  className="!h-4 !w-4 rounded-[2px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
                />
              </div>
            </div>
          );
        })}
      </div>
    </foreignObject>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  annotations
}: TooltipProps<number, string> & {
  annotations: TeamChartMatchAnnotation[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const probability = payload[0]?.value;
  const dateLabel = typeof label === "string" ? label : String(label ?? "");
  const annotation = findAnnotationForChartPoint(annotations, dateLabel);

  return (
    <div className="min-w-[140px] rounded-xl border border-[#EBEBEB] bg-white p-3 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
      <p className="m-0 text-sm font-[556] leading-[17px] text-[#909090]">
        {formatTooltipDate(dateLabel)}
      </p>
      <p className="m-0 mt-2 text-base font-[556] leading-[19px] text-black">
        {typeof probability === "number"
          ? formatProbability(probability)
          : "—"}
      </p>
      {annotation ? (
        <>
          <p className="m-0 mt-3 text-sm font-[556] leading-[17px] text-[#909090]">
            Match
          </p>
          <p className="m-0 mt-1 text-base font-[556] leading-[19px] text-black">
            {annotation.matchLabel}
          </p>
        </>
      ) : null}
    </div>
  );
}

function formatChartDayTick(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return String(date.getDate());
}

function formatTooltipDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}
