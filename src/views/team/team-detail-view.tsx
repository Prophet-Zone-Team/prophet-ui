"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import type { MarketDataMeta } from "@/data/providers/types";
import { useAnalyticsTeamMarketNews } from "@/hooks/analytics/use-analytics-team-market-news";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { useTeamDetail } from "@/hooks/team/use-team-detail";
import { useTeamLineup } from "@/hooks/team/use-team-lineup";
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
  const t = useTranslations("teamDetail");
  const { data, isLoading, isError, refetch } = useTeamDetail(snapshot.team.name);
  const pageReady = !(isLoading && !data);
  const lineup = useTeamLineup(snapshot.team.name, pageReady);
  const marketNews = useAnalyticsTeamMarketNews(snapshot.team.name);
  const teamDisplayName = useLocalizedTeamName(
    snapshot.team.code,
    snapshot.team.name
  );

  const movementNarrative = useMemo(() => {
    const change24h = marketNews.intelligence.change24h;
    const relatedNewsCount = marketNews.totalNews;
    const delta = Math.abs(change24h);
    const change = `${change24h >= 0 ? "+" : "-"}${(delta * 100).toFixed(1)}%`;
    const newsCopy =
      relatedNewsCount > 0
        ? relatedNewsCount === 1
          ? t("relatedNewsItemSingular", { count: relatedNewsCount })
          : t("relatedNewsItemsPlural", { count: relatedNewsCount })
        : t("noQualifyingNewsItem");

    return change24h >= 0
      ? t("movementRose", { teamName: teamDisplayName, change, newsCopy })
      : t("movementFell", { teamName: teamDisplayName, change, newsCopy });
  }, [
    marketNews.intelligence.change24h,
    marketNews.totalNews,
    t,
    teamDisplayName
  ]);

  if (isError && !data) {
    return (
      <div className={teamPageClass}>
        <TeamDetailHeader snapshot={snapshot} />
        <TeamEmptyState
          title={t("unableToLoadTeamData")}
          body={t("teamAnalyticsLoadError")}
        />
        <button
          type="button"
          className="mt-4 text-sm font-[500] text-[#125afc] hover:underline"
          onClick={() => void refetch()}
        >
          {t("retry")}
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
                <TeamKeyPlayersPanel
                  players={lineup.players}
                  isLoading={lineup.isLoading}
                />
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
                movementNarrative={movementNarrative}
              />
            </div>
          </div>

          <TeamDetailFootnote dataStatus={dataStatus} />
        </>
      )}
    </div>
  );
}
