"use client";

import { useId, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { formatProbability } from "../../components/home/market-formatters";
import type {
  ProbabilityHistoryPoint,
  TeamMarketSnapshot
} from "../../types/market";
import {
  filterTeamChartByRange,
  getTeamChartYDomain,
  resolveTeamChartData,
  TEAM_CHART_TIME_RANGES,
  type TeamChartTimeRange
} from "../../lib/team/probability-history";
import { TeamPanelMetric } from "./team-panel-metric";
import { cn } from "../../lib/cn";
import {
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "./team-detail-ui";

export interface TeamProbabilityPanelProps {
  history: ProbabilityHistoryPoint[];
  snapshot: TeamMarketSnapshot;
}

export function TeamProbabilityPanel({
  history,
  snapshot
}: TeamProbabilityPanelProps) {
  const gradientId = useId().replace(/:/g, "");
  const [timeRange, setTimeRange] = useState<TeamChartTimeRange>("1W");

  const chartData = useMemo(() => {
    const base = resolveTeamChartData(snapshot, history);
    return filterTeamChartByRange(base, timeRange);
  }, [history, snapshot, timeRange]);

  const low = Math.min(...chartData.map((point) => point.probability), snapshot.market.probability);
  const high = Math.max(...chartData.map((point) => point.probability), snapshot.market.probability);
  const latest = chartData.at(-1)?.probability ?? snapshot.market.probability;
  const yDomain = useMemo(() => getTeamChartYDomain(chartData), [chartData]);

  return (
    <section className={teamPanelClass} aria-label="Winner probability over time">
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>Winner Probability Over Time</h2>
        <div
          className="inline-flex items-center gap-0.5 rounded-full border border-prophet-line bg-[#fafbfc] p-0.5"
          aria-label="Probability range"
        >
          {TEAM_CHART_TIME_RANGES.filter((r) =>
            ["1D", "1W", "1M"].includes(r.id)
          ).map((range) => (
            <button
              key={range.id}
              type="button"
              onClick={() => setTimeRange(range.id)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-[556] transition-colors",
                timeRange === range.id
                  ? "bg-white text-black shadow-sm"
                  : "text-prophet-muted hover:text-black"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#125afc" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#125afc" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#ebebeb" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#909090", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                minTickGap={22}
                tickFormatter={(value: string) => {
                  const parsed = Date.parse(value);
                  if (Number.isNaN(parsed)) {
                    return value;
                  }

                  return new Intl.DateTimeFormat("en", {
                    month: "short",
                    day: "numeric"
                  }).format(parsed);
                }}
              />
              <YAxis
                domain={yDomain}
                tick={{ fill: "#909090", fontSize: 10 }}
                tickFormatter={(value: number) => `${Number(value).toFixed(1)}%`}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #ebebeb",
                  borderRadius: 8,
                  color: "#000"
                }}
                formatter={(value: number) => [
                  formatProbability(value),
                  "Probability"
                ]}
              />
              <Area
                type="monotone"
                dataKey="probability"
                stroke="#125afc"
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <TeamPanelMetric label="Range low" value={formatProbability(low)} />
          <TeamPanelMetric label="Latest" value={formatProbability(latest)} />
          <TeamPanelMetric label="Range high" value={formatProbability(high)} />
        </div>
      </div>
    </section>
  );
}
