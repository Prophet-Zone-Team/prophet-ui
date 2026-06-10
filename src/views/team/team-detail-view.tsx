"use client";

import type { MarketDataMeta } from "@/data/providers/types";
import { useAnalyticsTeamMarketNews } from "@/hooks/analytics/use-analytics-team-market-news";
import { useTeamDetail } from "@/hooks/team/use-team-detail";
import { getTeamMarketMovementNarrative } from "@/lib/analytics/map-team-market-news";
import type { TeamMarketSnapshot } from "@/types/market";
import { TradeWidget } from "@/views/trade/trade-widget";
import { TeamDetailFootnote } from "@/views/team/team-detail-footnote";
import { TeamDetailHeader } from "@/views/team/team-detail-header";
import { TeamDetailBodySkeleton } from "@/views/team/team-detail-loading";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import { TeamKeyPlayersPanel } from "@/views/team/team-key-players-panel";
import { TeamMarketIntelligencePanel } from "@/views/team/team-market-intelligence-panel";
import { TeamNewsSignalsPanel } from "@/views/team/team-news-signals-panel";
import { TeamNextMatchPanel } from "@/views/team/team-next-match-panel";
import { TeamProbabilityPanel } from "@/views/team/team-probability-panel";
import { TeamStrengthPanel } from "@/views/team/team-strength-panel";
import { teamPageClass } from "@/views/team/team-detail-ui";
import { TeamRecentMatchesPanel } from "./team-recent-matches-panel";
import { DossierGroupContext } from "./dossier-group-context";

export interface TeamDetailViewProps {
  snapshot: TeamMarketSnapshot;
  dataStatus: MarketDataMeta;
}

export function TeamDetailView({ snapshot, dataStatus }: TeamDetailViewProps) {
  const { data, isLoading, isError, refetch } = useTeamDetail(snapshot.team.name);
  const marketNews = useAnalyticsTeamMarketNews(snapshot.team.name);

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
          className="mt-4 text-sm font-[500] text-[#125afc] hover:underline"
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
          <div className="grid grid-cols-1 md:grid-cols-[1fr_345px] gap-4">
            <div className="md:grid md:grid-cols-2 flex flex-col gap-4">
              <TeamRecentMatchesPanel matches={data?.recentMatches ?? []} />
              <DossierGroupContext groupLabel={data?.groupLabel} peers={data?.groupPeers ?? []} />
              <TeamStrengthPanel
                metrics={data?.strengthMetrics ?? []}
                overallScore={data?.strengthScore}
              />
              <TeamProbabilityPanel snapshot={snapshot} />
              <div className="grid gird-cols-1 gap-4 col-span-2">
                <TeamKeyPlayersPanel players={data?.keyStars ?? []} />
                <TeamNewsSignalsPanel
                  items={marketNews.newsItems}
                  snapshot={snapshot}
                />
              </div>
            </div>
            <div className="grid gird-cols-1 gap-4">
              <TradeWidget
                snapshot={snapshot}
                outcomeButtonClassName="w-full"
                outcomeButtonContainerClassName="gap-3"
              />
              <TeamNextMatchPanel nextMatch={data?.nextMatch} snapshot={snapshot} />
              <TeamMarketIntelligencePanel
                snapshot={snapshot}
                dataStatus={dataStatus}
                intelligence={marketNews.intelligence}
                isEmpty={!marketNews.hasMarket}
                relatedNewsCount={marketNews.totalNews}
                movementNarrative={getTeamMarketMovementNarrative(
                  snapshot.team.name,
                  marketNews.intelligence.change24h,
                  marketNews.totalNews
                )}
              />
            </div>
          </div>

          <TeamDetailFootnote dataStatus={dataStatus} />
        </>
      )}
    </div>
  );
}
