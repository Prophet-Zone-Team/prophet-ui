"use client";

import { useMemo } from "react";

import { useProbabilityChart } from "@/hooks/market/use-probability-chart";
import { resolveTeamOrderbookTokenId } from "@/lib/market/resolve-team-orderbook-token";
import type { TeamMarketSnapshot } from "@/types/market";
import { WinnerProbabilityChart } from "@/views/home/winner/probability-chart";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface TeamProbabilityPanelProps {
  snapshot: TeamMarketSnapshot;
}

export function TeamProbabilityPanel({ snapshot }: TeamProbabilityPanelProps) {
  const yesTokenId = resolveTeamOrderbookTokenId(snapshot, "yes");
  const { points, status } = useProbabilityChart({
    kind: "team",
    tokenId: yesTokenId,
    entityId: snapshot.team.id,
    pollIntervalMs: 5000,
    enabled: Boolean(yesTokenId)
  });

  const probabilityHistory = useMemo(
    () => (status === "ready" ? points : []),
    [points, status]
  );

  const teams = useMemo(() => [snapshot], [snapshot]);

  return (
    <section className={teamPanelClass} aria-label="Winner probability over time">
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>Winner Probability Over Time</h2>
      </div>
      <div className="p-4 pt-0">
        {!yesTokenId ? (
          <TeamEmptyState
            title="Probability history pending"
            body="Market token data is not available for this team yet."
          />
        ) : status === "loading" ? (
          <p className="py-8 text-center text-sm text-prophet-muted">Loading...</p>
        ) : status === "error" ? (
          <TeamEmptyState
            title="Unable to load probability history"
            body="Winner probability history could not be loaded from the market."
          />
        ) : (
          <WinnerProbabilityChart
            className="border-0 px-0 pb-0 pt-3 shadow-none"
            teams={teams}
            probabilityHistory={probabilityHistory}
            hideTitle
            topTeamCount={1}
            showAxisTooltip
          />
        )}
      </div>
    </section>
  );
}
