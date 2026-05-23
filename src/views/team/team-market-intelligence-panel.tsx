"use client";

import { useId, useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

import type { MarketDataMeta } from "@/data/providers/types";
import { getMarketDataSourceLabel } from "@/data/providers/source";
import {
  formatChange,
  formatProbability,
  formatVolume,
  getSentimentLabel
} from "@/components/home/market-formatters";
import type {
  ProbabilityHistoryPoint,
  TeamMarketSnapshot
} from "@/types/market";
import { getMovementNarrative, resolveChartHistory } from "@/lib/team/team-detail-model";
import { formatShortDate } from "@/lib/team/team-detail-model";
import { TeamPanelMetric } from "@/views/team/team-panel-metric";
import {
  teamMiniGridClass,
  teamPanelBadgeClass,
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface TeamMarketIntelligencePanelProps {
  snapshot: TeamMarketSnapshot;
  history: ProbabilityHistoryPoint[];
  dataStatus: MarketDataMeta;
  relatedNewsCount: number;
}

export function TeamMarketIntelligencePanel({
  snapshot,
  history,
  dataStatus,
  relatedNewsCount
}: TeamMarketIntelligencePanelProps) {
  const gradientId = useId().replace(/:/g, "");
  const mismatch =
    snapshot.market.probability - snapshot.market.bookmakerImpliedProbability;
  const chartData = useMemo(
    () => resolveChartHistory(snapshot, history).slice(-12),
    [history, snapshot]
  );

  return (
    <section className={teamPanelClass} aria-label="Market intelligence">
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>Market Intelligence</h2>
        <span className={teamPanelBadgeClass}>
          {getMarketDataSourceLabel(dataStatus.source)}
        </span>
      </div>
      <div className="flex flex-col gap-4 p-4">
        <div className={teamMiniGridClass}>
          <TeamPanelMetric
            label="Winner probability"
            value={formatProbability(snapshot.market.probability)}
          />
          <TeamPanelMetric
            label="24h change"
            value={formatChange(snapshot.market.change24h)}
            tone={snapshot.market.change24h < 0 ? "down" : "up"}
          />
          <TeamPanelMetric
            label="7d change"
            value={formatChange(snapshot.market.change7d)}
            tone={snapshot.market.change7d < 0 ? "down" : "up"}
          />
          <TeamPanelMetric
            label="Market volume"
            value={formatVolume(snapshot.market.volume)}
          />
          <TeamPanelMetric
            label="Liquidity"
            value={
              snapshot.market.liquidity
                ? formatVolume(snapshot.market.liquidity)
                : "Pending"
            }
          />
          <TeamPanelMetric
            label="Sentiment"
            value={getSentimentLabel(snapshot.market.sentiment)}
          />
          <TeamPanelMetric
            label="Odds spread"
            value={formatChange(mismatch)}
            tone={mismatch < 0 ? "down" : "up"}
          />
          <TeamPanelMetric
            label="News signals"
            value={String(relatedNewsCount)}
          />
          <TeamPanelMetric
            label="Updated"
            value={formatShortDate(dataStatus.lastUpdated)}
          />
        </div>

        <div className="h-[72px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#125afc" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#125afc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="probability"
                stroke="#125afc"
                strokeWidth={2}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-prophet-line bg-[#fafbfc] px-3 py-2.5">
          <span className="text-[10px] font-[556] uppercase tracking-wide text-prophet-muted">
            Why it moved
          </span>
          <p className="m-0 mt-1 text-xs leading-relaxed text-black">
            {getMovementNarrative(snapshot, relatedNewsCount)}
          </p>
        </div>
      </div>
    </section>
  );
}
