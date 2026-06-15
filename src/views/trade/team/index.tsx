"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { TrackedTeamRevisitEffect } from "@/components/analytics/tracked-team-revisit-effect";
import Drawer from "@/components/drawer";
import { SyncMatchLiveStore } from "@/components/match/sync-match-live-store";
import { MarketWsProvider } from "@/context/market-ws";
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
import type {
  ApiFootballTeamProfile,
  TeamFootballMetadata,
  TeamMarketSnapshot
} from "@/types/market";
import { ActivityTabs } from "@/views/trade/team/activity-tabs";
import { MarketDetailsNav } from "@/views/trade/team/market-details-nav";
import { TradeHeader } from "@/views/trade/team/trade-header";
import { useTeamMarketWsTokens } from "@/views/trade/team/use-team-market-ws-tokens";
import { ProbabilitySection } from "@/views/trade/team-probability";
import { RelatedGames } from "@/views/trade/related-games";
import { TradeWidget } from "@/views/trade/trade-widget";
import { tradePageClass } from "@/views/trade/trade-widget/trade-ui";

export interface TradeTeamViewProps {
  snapshot: TeamMarketSnapshot;
  footballProfile?: ApiFootballTeamProfile;
  footballMetadata?: TeamFootballMetadata;
}

function TradeTeamViewContent({
  snapshot,
  footballProfile,
  footballMetadata
}: TradeTeamViewProps) {
  const t = useTranslations("trade");
  const showOrderbook = useShowOrderbook();
  const setShowOrderbook = useSetShowOrderbook();
  const setOutcomeSide = useSetTradeOutcomeSide();
  const setTab = useSetTradeTab();
  const setOrderMode = useSetTradeOrderMode();
  const outcomeSide = useTradeOutcomeSide();
  const [tradeDrawerOpen, setTradeDrawerOpen] = useState(false);
  const allSnapshots = useMemo(() => [snapshot], [snapshot]);

  useTeamMarketWsTokens(
    snapshot,
    Boolean(
      snapshot.market.polymarket?.tokens.yes?.tokenId ||
      snapshot.market.polymarket?.tokens.no?.tokenId
    )
  );

  function openTradeDrawer(side: "yes" | "no") {
    setOutcomeSide(side);
    setTab("buy");
    setOrderMode("market");
    setTradeDrawerOpen(true);
  }

  const drawerTitle = outcomeSide === "yes" ? t("buyYes") : t("buyNo");

  return (
    <div className={cn(tradePageClass, "pb-[130px] md:pb-10")}>
      <TrackedTeamRevisitEffect
        teamId={snapshot.team.id}
        teamName={snapshot.team.name}
        teamCode={snapshot.team.code}
        slug={snapshot.market.slug}
        entrySource="trade_team_page"
      />
      <SyncMatchLiveStore matches={[]} />
      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_345px] xl:items-start">
        <div className="order-2 flex min-w-0 flex-col gap-4 xl:order-1">
          <TradeHeader
            snapshot={snapshot}
            profile={footballProfile}
            metadata={footballMetadata}
            showOrderbook={showOrderbook}
            onOrderbookChange={setShowOrderbook}
          />
          <MarketDetailsNav snapshot={snapshot} />
          <ProbabilitySection
            snapshot={snapshot}
            showOrderbook={showOrderbook}
          />
          <ActivityTabs snapshot={snapshot} />
        </div>

        <aside className="order-1 hidden min-w-0 flex-col gap-4 md:flex xl:order-2 xl:sticky xl:top-14">
          <TradeWidget
            snapshot={snapshot}
            outcomeButtonClassName="w-full"
            outcomeButtonContainerClassName="gap-3"
          />
          <RelatedGames
            teamNames={[snapshot.team.name]}
            highlightTeamId={snapshot.team.id}
            snapshots={allSnapshots}
          />
        </aside>
      </div>

      <div className="fixed bottom-0 left-0 z-10 flex w-full items-center justify-between gap-5 p-3 md:hidden">
        <button
          type="button"
          className="flex h-[46px] flex-1 items-center justify-center rounded-xl bg-[#FF674B] text-lg font-[500] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => openTradeDrawer("no")}
        >
          {t("no")}
        </button>
        <button
          type="button"
          className="flex h-[46px] flex-1 items-center justify-center rounded-xl bg-[#65AF14] text-lg font-[500] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => openTradeDrawer("yes")}
        >
          {t("yes")}
        </button>
      </div>

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
    </div>
  );
}

export default function TradeTeamView({
  snapshot,
  footballProfile,
  footballMetadata
}: TradeTeamViewProps) {
  const yesTokenId = snapshot.market.polymarket?.tokens.yes?.tokenId;
  const noTokenId = snapshot.market.polymarket?.tokens.no?.tokenId;
  const marketWsEnabled = Boolean(yesTokenId || noTokenId);

  return (
    <MarketWsProvider enabled={marketWsEnabled}>
      <TradeTeamViewContent
        snapshot={snapshot}
        footballProfile={footballProfile}
        footballMetadata={footballMetadata}
      />
    </MarketWsProvider>
  );
}

/** @deprecated Use TradeTeamViewProps */
export type TradeViewProps = TradeTeamViewProps;
