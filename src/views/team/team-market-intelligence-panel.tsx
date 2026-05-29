"use client";

import type { MarketDataMeta } from "@/data/providers/types";
import { getMarketDataSourceLabel } from "@/data/providers/source";
import type { TeamMarketSnapshot } from "@/types/market";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface TeamMarketIntelligencePanelProps {
  snapshot: TeamMarketSnapshot;
  dataStatus: MarketDataMeta;
  isEmpty?: boolean;
}

export function TeamMarketIntelligencePanel({
  snapshot,
  dataStatus,
  isEmpty = false
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
        ) : null}
      </div>
    </section>
  );
}
