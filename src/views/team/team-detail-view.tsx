"use client";

import type { MarketDataMeta } from "@/data/providers/types";
import { useTeamDetail } from "@/hooks/team/use-team-detail";
import type { TeamMarketSnapshot } from "@/types/market";
import { TradeWidget } from "@/views/trade/trade-widget";
import { DossierStrip } from "@/views/team/dossier-strip";
import { TeamDetailFootnote } from "@/views/team/team-detail-footnote";
import { TeamDetailHeader } from "@/views/team/team-detail-header";
import { TeamDetailBodySkeleton } from "@/views/team/team-detail-loading";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import { TeamKeyPlayersPanel } from "@/views/team/team-key-players-panel";
import { TeamLineupPanel } from "@/views/team/team-lineup-panel";
import { TeamMarketIntelligencePanel } from "@/views/team/team-market-intelligence-panel";
import { TeamNewsSignalsPanel } from "@/views/team/team-news-signals-panel";
import { TeamNextMatchPanel } from "@/views/team/team-next-match-panel";
import { TeamProbabilityPanel } from "@/views/team/team-probability-panel";
import { TeamStrengthPanel } from "@/views/team/team-strength-panel";
import {
  teamMainColumnClass,
  teamMainGridClass,
  teamPageClass,
  teamSidebarClass,
  teamTwoUpClass
} from "@/views/team/team-detail-ui";

export interface TeamDetailViewProps {
  snapshot: TeamMarketSnapshot;
  dataStatus: MarketDataMeta;
}

export function TeamDetailView({ snapshot, dataStatus }: TeamDetailViewProps) {
  const { data, isLoading, isError, refetch } = useTeamDetail(
    snapshot.team.name,
    snapshot.team.code
  );

  if (isError && !data) {
    return (
      <div className={teamPageClass}>
        <TeamDetailHeader snapshot={snapshot} />
        <TeamEmptyState
          title="Unable to load team data"
          body="Team analytics could not be loaded. Please try again."
        />
        <button
          type="button"
          className="mt-4 text-sm font-[556] text-[#125afc] hover:underline"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={teamPageClass}>
      <TeamDetailHeader snapshot={snapshot} detail={data?.header} />

      {isLoading && !data ? (
        <TeamDetailBodySkeleton />
      ) : (
        <>
          <DossierStrip
            groupLabel={data?.groupLabel}
            peers={data?.groupPeers ?? []}
            keyStars={data?.keyStars ?? []}
            recentMatches={data?.recentMatches ?? []}
          />

          <div className={teamMainGridClass}>
            <div className={teamMainColumnClass}>
              <div className={teamTwoUpClass}>
                <TeamStrengthPanel
                  metrics={data?.strengthMetrics ?? []}
                  overallScore={data?.strengthScore}
                />
                <TeamProbabilityPanel snapshot={snapshot} />
              </div>

              <TeamNewsSignalsPanel
                items={data?.newsItems ?? []}
                snapshot={snapshot}
              />
              <TeamLineupPanel squad={[]} injuries={[]} dataIssues={[]} />
              <TeamKeyPlayersPanel players={data?.keyStars ?? []} />
            </div>

            <aside className={teamSidebarClass}>
              <TeamNextMatchPanel nextMatch={data?.nextMatch} snapshot={snapshot} />
              <TradeWidget
                snapshot={snapshot}
                outcomeButtonClassName="w-full"
                outcomeButtonContainerClassName="gap-3"
              />
              <TeamMarketIntelligencePanel
                snapshot={snapshot}
                dataStatus={dataStatus}
                isEmpty
              />
            </aside>
          </div>

          <TeamDetailFootnote dataStatus={dataStatus} />
        </>
      )}
    </div>
  );
}
