"use client";

import type { MarketDataMeta } from "@/data/providers/types";
import { getMarketDataSourceLabel } from "@/data/providers/source";
import type { TeamMarketSnapshot } from "@/types/market";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamMiniGridClass,
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";
import { TeamPanelMetric } from "./team-panel-metric";
import { formatChange, formatProbability, formatShortDate } from "@/lib/team/team-detail-model";
import { formatVolume, getSentimentLabel } from "@/components/home/market-formatters";
import type { TeamMarketIntelligenceData } from "@/lib/analytics/map-team-market-news";

export interface TeamMarketIntelligencePanelProps {
  snapshot: TeamMarketSnapshot;
  dataStatus: MarketDataMeta;
  intelligence: TeamMarketIntelligenceData;
  isEmpty?: boolean;
  relatedNewsCount: number;
  movementNarrative: string;
}

export function TeamMarketIntelligencePanel({
  snapshot,
  dataStatus,
  intelligence,
  isEmpty = false,
  relatedNewsCount,
  movementNarrative
}: TeamMarketIntelligencePanelProps) {
  return (
    <section className={teamPanelClass} aria-label="Market intelligence">
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>Market Intelligence</h2>
      </div>
      <div className="p-4">
        {isEmpty ? (
          <TeamEmptyState
            title="Market intelligence pending"
            body={`Market intelligence summary is not available for ${snapshot.team.name} yet. Live market data may still load from ${getMarketDataSourceLabel(dataStatus.source)}.`}
          />
        ) : (
          <div className="flex flex-col gap-4 p-4">
            <div className={teamMiniGridClass}>
              <TeamPanelMetric
                label="Winner probability"
                value={formatProbability(intelligence.probability)}
              />
              <TeamPanelMetric
                label="24h change"
                value={formatChange(intelligence.change24h)}
                tone={intelligence.change24h < 0 ? "down" : "up"}
              />
              <TeamPanelMetric
                label="7d change"
                value={formatChange(intelligence.change7d)}
                tone={intelligence.change7d < 0 ? "down" : "up"}
              />
              <TeamPanelMetric
                label="Market volume"
                value={formatVolume(intelligence.volume)} />
              <TeamPanelMetric
                label="Liquidity"
                value={
                  intelligence.liquidity
                    ? formatVolume(intelligence.liquidity)
                    : "Pending"
                }
              />
              <TeamPanelMetric
                label="Sentiment"
                value={getSentimentLabel(intelligence.sentiment)}
              />
              <TeamPanelMetric
                label="News signals"
                value={String(relatedNewsCount)}
              />
              <TeamPanelMetric
                label="Updated"
                value={formatShortDate(intelligence.updatedAt ?? dataStatus.lastUpdated)}
              />
            </div>

            <div className="rounded-lg border border-prophet-line bg-[#fafbfc] px-3 py-2.5">
              <span className="text-[10px] font-[556] uppercase tracking-wide text-prophet-muted">
                Why it moved
              </span>
              <p className="m-0 mt-1 text-xs leading-relaxed text-black">
                {movementNarrative}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
