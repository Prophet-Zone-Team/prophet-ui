"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import Drawer from "@/components/drawer";
import type { MarketDataMeta } from "@/data/providers/types";
import { useAnalyticsTeamMarketNews } from "@/hooks/analytics/use-analytics-team-market-news";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { useTeamDetail } from "@/hooks/team/use-team-detail";
import { cn } from "@/lib/cn";
import {
  useSetTradeOrderMode,
  useSetTradeOutcomeSide,
  useSetTradeTab,
  useTradeOutcomeSide
} from "@/store";
import {
  useSetShowOrderbook,
  useShowOrderbook
} from "@/store/user-config-store";
import type { TeamMarketSnapshot } from "@/types/market";
import { MarketDetailsNav } from "@/views/trade/team/market-details-nav";
import { TeamMobileTradeButtons } from "@/views/trade/team/team-mobile-trade-buttons";
import { TradeHeader } from "@/views/trade/team/trade-header";
import { useTeamMarketWsTokens } from "@/views/trade/team/use-team-market-ws-tokens";
import { useTeamMobileOutcomePrices } from "@/views/trade/team/use-team-mobile-outcome-prices";
import { TradeWidget } from "@/views/trade/trade-widget";
import { TeamDetailFootnote } from "@/views/team/team-detail-footnote";
import { TeamDetailHeader } from "@/views/team/team-detail-header";
import {
  TeamDetailBodySkeleton,
  TeamDetailMobileBodySkeleton
} from "@/views/team/team-detail-loading";
import { TeamDetailMobileStats } from "@/views/team/team-detail-mobile-stats";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import { TeamKeyPlayersPanel } from "@/views/team/team-key-players-panel";
import { TeamLineupPanel } from "@/views/team/team-lineup-panel";
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
  mobileBackEntry?: "trade";
}

export function TeamDetailView({
  snapshot,
  dataStatus,
  mobileBackEntry
}: TeamDetailViewProps) {
  const t = useTranslations("teamDetail");
  const tTrade = useTranslations("trade");
  const showOrderbook = useShowOrderbook();
  const setShowOrderbook = useSetShowOrderbook();
  const setOutcomeSide = useSetTradeOutcomeSide();
  const setTab = useSetTradeTab();
  const setOrderMode = useSetTradeOrderMode();
  const outcomeSide = useTradeOutcomeSide();
  const [tradeDrawerOpen, setTradeDrawerOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useTeamDetail(snapshot.team.name);
  const marketWsEnabled = Boolean(
    snapshot.market.polymarket?.tokens.yes?.tokenId ||
      snapshot.market.polymarket?.tokens.no?.tokenId
  );

  useTeamMarketWsTokens(snapshot, marketWsEnabled);
  const { yesPrice, noPrice } = useTeamMobileOutcomePrices(
    snapshot,
    marketWsEnabled
  );
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

  function openTradeDrawer(side: "yes" | "no") {
    setOutcomeSide(side);
    setTab("buy");
    setOrderMode("market");
    setTradeDrawerOpen(true);
  }

  const drawerTitle =
    outcomeSide === "yes" ? tTrade("buyYes") : tTrade("buyNo");
  const pageClassName = cn(teamPageClass, "pb-[130px] md:pb-10");
  const mobilePageBackSteps = mobileBackEntry === "trade" ? 2 : 1;

  const header = (
    <>
      <div className="md:hidden">
        <TradeHeader
          snapshot={snapshot}
          showOrderbook={showOrderbook}
          onOrderbookChange={setShowOrderbook}
          pageBackHistorySteps={mobilePageBackSteps}
        />
        <MarketDetailsNav snapshot={snapshot} activeTab="details" />
      </div>
      <div className="hidden md:block">
        <TeamDetailHeader snapshot={snapshot} detail={data?.header} />
      </div>
    </>
  );

  const mobileTradeBar = (
    <>
      <TeamMobileTradeButtons
        yesPrice={yesPrice}
        noPrice={noPrice}
        onSelect={openTradeDrawer}
      />

      <Drawer
        open={tradeDrawerOpen}
        onClose={() => setTradeDrawerOpen(false)}
        title={drawerTitle}
        className="!h-auto max-h-[70dvh]"
      >
        <TradeWidget
          snapshot={snapshot}
          outcomeButtonClassName="w-full"
          outcomeButtonContainerClassName="gap-3"
          className="border-0 rounded-none"
        />
      </Drawer>
    </>
  );

  if (isError && !data) {
    return (
      <div className={pageClassName}>
        {header}
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
        {mobileTradeBar}
      </div>
    );
  }

  return (
    <div className={pageClassName}>
      {header}

      {isLoading && !data ? (
        <>
          <TeamDetailMobileBodySkeleton />
          <div className="hidden md:block">
            <TeamDetailBodySkeleton />
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-4 md:hidden">
            <TeamDetailMobileStats detail={data?.header} />
            <TeamRecentMatchesPanel matches={data?.recentMatches ?? []} />
            <TeamNextMatchPanel
              nextMatch={data?.nextMatch}
              snapshot={snapshot}
            />
            <DossierGroupContext
              groupLabel={data?.groupLabel}
              peers={data?.groupPeers ?? []}
            />
            <TeamKeyPlayersPanel players={data?.keyStars ?? []} />
            <TeamLineupPanel teamName={snapshot.team.name} />
            <TeamStrengthPanel
              metrics={data?.strengthMetrics ?? []}
              overallScore={data?.strengthScore}
            />
          </div>

          <div className="hidden md:grid md:grid-cols-[1fr_345px] gap-4">
            <div className="md:grid md:grid-cols-2 flex flex-col gap-4">
              <TeamRecentMatchesPanel matches={data?.recentMatches ?? []} />
              <DossierGroupContext
                groupLabel={data?.groupLabel}
                peers={data?.groupPeers ?? []}
              />
              <TeamStrengthPanel
                metrics={data?.strengthMetrics ?? []}
                overallScore={data?.strengthScore}
              />
              <TeamProbabilityPanel snapshot={snapshot} />
              <div className="grid gird-cols-1 gap-4 col-span-2">
                <TeamKeyPlayersPanel players={data?.keyStars ?? []} />
                <TeamLineupPanel teamName={snapshot.team.name} />
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
              <TeamNextMatchPanel
                nextMatch={data?.nextMatch}
                snapshot={snapshot}
              />
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

          <div className="hidden md:block">
            <TeamDetailFootnote dataStatus={dataStatus} />
          </div>
        </>
      )}
      {mobileTradeBar}
    </div>
  );
}
