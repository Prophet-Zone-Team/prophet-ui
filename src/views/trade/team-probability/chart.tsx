"use client";

import { memo, useId, useMemo } from "react";
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

import { TeamFlag } from "@/components/teams/team-flag";
import { formatProbability } from "@/components/home/market-formatters";
import {
  findAnnotationForChartPoint,
  type TeamChartMatchAnnotation
} from "@/lib/team/chart-match-annotations";
import { formatDateFromIso } from "@/lib/formatters/datetime";
import {
  formatTeamChartXAxisTick,
  type TeamChartTimeRange
} from "@/lib/team/probability-history";
import type { ProbabilityHistoryPoint } from "@/types/market";

const CHART_LINE_COLOR = "#8AB956";
const CHART_FILL_TOP = "rgba(138, 185, 86, 0.3)";
const MATCH_LABEL_WIDTH = 83;
const MATCH_LABEL_HEIGHT = 36;
const MATCH_LABEL_GAP = 8;

interface FormattedGraphicalItem {
  item?: {
    type?: {
      displayName?: string;
    };
  };
  props?: {
    points?: Array<{
      x: number;
      y: number;
    }>;
  };
}

interface ChartCustomizedProps {
  formattedGraphicalItems?: FormattedGraphicalItem[];
}

interface ProbabilityChartProps {
  chartData: ProbabilityHistoryPoint[];
  yDomain: [number, number];
  annotations: TeamChartMatchAnnotation[];
  timeRange: TeamChartTimeRange;
}

export function ProbabilityChart({
  chartData,
  yDomain,
  annotations,
  timeRange
}: ProbabilityChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const formatXAxisTick = (value: string) =>
    formatTeamChartXAxisTick(value, timeRange);
  const annotationByIndex = useMemo(
    () =>
      new Map(
        annotations.map((annotation) => [annotation.chartIndex, annotation])
      ),
    [annotations]
  );

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
            tick={{ fill: "#909090", fontSize: 14, dy: 6 }}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
            tickFormatter={formatXAxisTick}
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
            content={<ChartTooltip annotations={annotations} />}
          />
          <Area
            type="monotone"
            dataKey="probability"
            stroke={CHART_LINE_COLOR}
            strokeWidth={1}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            dot={false}
            activeDot={(props) => {
              const annotation = annotationByIndex.get(props.index ?? -1);

              if (annotation) {
                return <g />;
              }

              return (
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={5}
                  fill={CHART_LINE_COLOR}
                  stroke="rgba(101, 175, 20, 0.2)"
                  strokeWidth={3}
                />
              );
            }}
          />
          <Customized
            component={(props: ChartCustomizedProps) => (
              <MatchMarkerLayer
                formattedGraphicalItems={props.formattedGraphicalItems}
                annotations={annotations}
              />
            )}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const MatchMarkerDot = memo(function MatchMarkerDot({
  cx,
  cy,
  annotation
}: {
  cx: number;
  cy: number;
  annotation: TeamChartMatchAnnotation;
}) {
  const labelX = cx - MATCH_LABEL_WIDTH / 2;
  const labelY = cy - MATCH_LABEL_HEIGHT - MATCH_LABEL_GAP;

  return (
    <g className="pointer-events-none">
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={CHART_LINE_COLOR}
        stroke="rgba(101, 175, 20, 0.2)"
        strokeWidth={3}
      />
      <foreignObject
        x={labelX}
        y={labelY}
        width={MATCH_LABEL_WIDTH}
        height={MATCH_LABEL_HEIGHT}
        className="overflow-visible"
      >
        <div className="flex h-full items-center justify-center  gap-1 rounded border border-[#EBEBEB] bg-white px-1.5 py-1 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
          <TeamFlag
            code={annotation.homeCode}
            name={annotation.homeName}
            className="!h-4 !w-4 rounded-[2px]"
          />
          <span className="text-sm shrink-0 font-[500] leading-[17px] text-[#909090]">
            {annotation.scoreLabel}
          </span>
          <TeamFlag
            code={annotation.awayCode}
            name={annotation.awayName}
            className="!h-4 !w-4 rounded-[2px]"
          />
        </div>
      </foreignObject>
    </g>
  );
});

function MatchMarkerLayer({
  formattedGraphicalItems,
  annotations
}: ChartCustomizedProps & {
  annotations: TeamChartMatchAnnotation[];
}) {
  const areaPoints = useMemo(
    () => getAreaChartPoints(formattedGraphicalItems),
    [formattedGraphicalItems]
  );

  if (annotations.length === 0 || areaPoints.length === 0) {
    return null;
  }

  return (
    <g className="pointer-events-none">
      {annotations.map((annotation) => {
        const point = areaPoints[annotation.chartIndex];

        if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
          return null;
        }

        return (
          <MatchMarkerDot
            key={annotation.matchId}
            cx={point.x}
            cy={point.y}
            annotation={annotation}
          />
        );
      })}
    </g>
  );
}

function getAreaChartPoints(
  formattedGraphicalItems?: FormattedGraphicalItem[]
): Array<{ x: number; y: number }> {
  const areaItem = formattedGraphicalItems?.find(
    (item) => item?.item?.type?.displayName === "Area"
  );

  return areaItem?.props?.points ?? [];
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
      <p className="m-0 text-[14px] font-[400] leading-[17px] text-[#909090]">
        {formatTooltipDate(dateLabel)}
      </p>
      <p className="m-0 mt-2 text-[16px] font-[500] leading-[19px] text-black">
        {typeof probability === "number" ? formatProbability(probability) : "—"}
      </p>
      {annotation ? (
        <>
          <p className="m-0 mt-3 text-[14px] font-[400] leading-[17px] text-[#909090]">
            Match
          </p>
          <p className="m-0 mt-1 text-[16px] font-[500] leading-[19px] text-black">
            {annotation.matchLabel}
          </p>
        </>
      ) : null}
    </div>
  );
}

function formatTooltipDate(value: string): string {
  return formatDateFromIso(value);
}
