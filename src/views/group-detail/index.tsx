"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PageBack } from "@/components/ui/page-back";
import { MarketWsProvider } from "@/context/market-ws";
import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";
import { useGroupWinnerMarket } from "@/hooks/market/use-group-winner-market";
import {
  resolveDefaultSelectedTeamId,
  type GroupWinnerHeaderData
} from "@/lib/market/map-group-winner-event";
import {
  groupDetailHref,
  resolveGroupDetailTeamParam
} from "@/lib/routes/group";
import {
  useSetTradeOutcomeSide,
  useSyncTradeTicketSnapshot,
  useTradeOutcomeSide
} from "@/store";
import type { OrderOutcomeSide, TeamMarketSnapshot } from "@/types/market";
import { GroupDetailHeader } from "@/views/group-detail/header";
import { GroupMatchesPanel } from "@/views/group-detail/group-matches-panel";
import { GroupDetailTeam } from "@/views/group-detail/team";
import { GroupProbabilityChart } from "@/views/group-detail/probability-chart";
import { ProbabilitySection } from "@/views/trade/team-probability";
import { useTeamMarketWsTokens } from "@/views/trade/team/use-team-market-ws-tokens";
import { TradeWidget } from "@/views/trade/trade-widget";
import {
  tradePageClass,
  TRADE_BID_BUTTON_ID
} from "@/views/trade/trade-widget/trade-ui";

export interface GroupDetailViewProps {
  group: WorldCup2026Group;
  initialSnapshots: TeamMarketSnapshot[];
  initialHeader: GroupWinnerHeaderData;
}

function resolveInitialSelectedTeamId(
  snapshots: TeamMarketSnapshot[],
  teamFromUrl?: string
): string {
  if (
    teamFromUrl &&
    snapshots.some((snapshot) => snapshot.team.id === teamFromUrl)
  ) {
    return teamFromUrl;
  }

  return resolveDefaultSelectedTeamId(snapshots) ?? snapshots[0]?.team.id ?? "";
}

function GroupDetailViewContent({
  group,
  initialSnapshots,
  initialHeader
}: GroupDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tradeWidgetRef = useRef<HTMLDivElement>(null);
  const appliedUrlTeamRef = useRef(false);
  const teamFromUrl = resolveGroupDetailTeamParam(
    searchParams.get("team") ?? undefined
  );
  const sideFromUrl = searchParams.get("side");
  const outcomeSide = useTradeOutcomeSide();
  const setOutcomeSide = useSetTradeOutcomeSide();
  const syncTeamSnapshot = useSyncTradeTicketSnapshot();
  const [selectedTeamId, setSelectedTeamId] = useState<string>(() =>
    resolveInitialSelectedTeamId(initialSnapshots, teamFromUrl)
  );

  const { snapshots, header } = useGroupWinnerMarket({
    group,
    initialSnapshots,
    initialHeader
  });

  const selectedSnapshot = useMemo(
    () =>
      snapshots.find((snapshot) => snapshot.team.id === selectedTeamId) ??
      snapshots[0],
    [selectedTeamId, snapshots]
  );

  useEffect(() => {
    if (
      selectedTeamId &&
      snapshots.some((snapshot) => snapshot.team.id === selectedTeamId)
    ) {
      return;
    }

    const nextId = resolveInitialSelectedTeamId(snapshots, teamFromUrl);

    if (nextId) {
      setSelectedTeamId(nextId);
    }
  }, [selectedTeamId, snapshots, teamFromUrl]);

  useEffect(() => {
    if (appliedUrlTeamRef.current || !teamFromUrl) {
      return;
    }

    const snapshot = snapshots.find((entry) => entry.team.id === teamFromUrl);

    if (!snapshot) {
      return;
    }

    appliedUrlTeamRef.current = true;
    setSelectedTeamId(teamFromUrl);
    syncTeamSnapshot(snapshot);
    setOutcomeSide(sideFromUrl === "no" ? "no" : "yes");
  }, [teamFromUrl, sideFromUrl, snapshots, syncTeamSnapshot, setOutcomeSide]);

  const scrollToTradeWidget = useCallback(() => {
    const target =
      tradeWidgetRef.current ??
      document.getElementById(TRADE_BID_BUTTON_ID)?.closest("section");

    target?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const updateGroupDetailUrl = useCallback(
    (teamId: string, side: OrderOutcomeSide) => {
      router.replace(groupDetailHref(group, { team: teamId, side }), {
        scroll: false
      });
    },
    [group, router]
  );

  const handleSelectTeam = useCallback(
    (teamId: string) => {
      setSelectedTeamId(teamId);
      updateGroupDetailUrl(teamId, outcomeSide);
    },
    [updateGroupDetailUrl, outcomeSide]
  );

  const handleOutcomeClick = useCallback(
    (side: OrderOutcomeSide, teamId: string) => {
      updateGroupDetailUrl(teamId, side);
      scrollToTradeWidget();
    },
    [updateGroupDetailUrl, scrollToTradeWidget]
  );

  useTeamMarketWsTokens(
    selectedSnapshot,
    Boolean(
      selectedSnapshot?.market.polymarket?.tokens.yes?.tokenId ||
      selectedSnapshot?.market.polymarket?.tokens.no?.tokenId
    )
  );

  if (!selectedSnapshot) {
    return null;
  }

  return (
    <div className={tradePageClass}>
      <PageBack />

      <div className="flex pt-[10px] flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_345px] xl:items-start">
        <div className="order-2 flex min-w-0 flex-col gap-4 xl:order-1">
          <GroupDetailHeader
            title={header.title}
            dateRange={header.dateRange}
            volume={header.volume}
            slug={header.slug}
            group={group}
          />

          <GroupProbabilityChart
            className="rounded-[12px] border border-[#EBEBEB] bg-white px-4 pb-4 pt-3"
            teams={snapshots}
          />

          <section className="overflow-hidden rounded-[12px] border border-[#EBEBEB] bg-white">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)_1px_minmax(0,1fr)_1px_minmax(0,1fr)] xl:items-stretch xl:justify-items-center xl:gap-x-0">
              {snapshots.flatMap((snapshot, index) => {
                const team = (
                  <GroupDetailTeam
                    key={snapshot.team.id}
                    snapshot={snapshot}
                    selected={snapshot.team.id === selectedTeamId}
                    onSelect={() => handleSelectTeam(snapshot.team.id)}
                    tradeInPlace
                    onOutcomeClick={(side) =>
                      handleOutcomeClick(side, snapshot.team.id)
                    }
                    className="w-full max-w-[222px] py-4"
                  />
                );

                if (index >= snapshots.length - 1) {
                  return [team];
                }

                return [
                  team,
                  <div
                    key={`divider-${snapshot.team.id}`}
                    className="hidden w-px self-stretch bg-[#EBEBEB] xl:block"
                    aria-hidden
                  />
                ];
              })}
            </div>

            <div className="border-t border-[#EBEBEB]">
              <ProbabilitySection
                snapshot={selectedSnapshot}
                showOrderbook={true}
                showHeaderControls={false}
                borderless
                showChartOrderbookDivider
              />
            </div>
          </section>
        </div>

        <aside className="order-1 flex min-w-0 flex-col gap-4 xl:order-2 xl:sticky xl:top-14">
          <div ref={tradeWidgetRef}>
            <TradeWidget
              snapshot={selectedSnapshot}
              outcomeButtonClassName="w-full"
              outcomeButtonContainerClassName="gap-3"
            />
          </div>
          <GroupMatchesPanel
            group={group}
            snapshots={snapshots}
            highlightTeamId={selectedTeamId}
          />
        </aside>
      </div>
    </div>
  );
}

export function GroupDetailView(props: GroupDetailViewProps) {
  const marketWsEnabled = props.initialSnapshots.some(
    (snapshot) =>
      snapshot.market.polymarket?.tokens.yes?.tokenId ||
      snapshot.market.polymarket?.tokens.no?.tokenId
  );

  return (
    <MarketWsProvider enabled={marketWsEnabled}>
      <GroupDetailViewContent {...props} />
    </MarketWsProvider>
  );
}

export default GroupDetailView;
