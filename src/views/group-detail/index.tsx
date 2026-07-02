"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { GroupProbabilityChart } from "@/views/group-detail/probability-chart";
import Drawer from "@/components/drawer";
import { MarketWsProvider } from "@/context/market-ws";
import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";
import { useGroupWinnerMarket } from "@/hooks/market/use-group-winner-market";
import { useGroupGameData } from "@/hooks/market/use-group-game-data";
import { cn } from "@/lib/cn";
import {
  resolveDefaultSelectedTeamId,
  type GroupWinnerHeaderData
} from "@/lib/market/map-group-winner-event";
import {
  groupDetailHref,
  resolveGroupDetailTeamParam
} from "@/lib/routes/group";
import {
  useSetTradeOrderMode,
  useSetTradeOutcomeSide,
  useSetTradeTab,
  useSyncTradeTicketSnapshot,
  useTradeOutcomeSide
} from "@/store";
import { useShowOrderbook } from "@/store/user-config-store";
import type { OrderOutcomeSide, TeamMarketSnapshot } from "@/types/market";
import { groupDetailPanelClass } from "@/views/group-detail/group-detail-ui";
import { GroupDetailHeader } from "@/views/group-detail/header";
import { GroupMatchesPanel } from "@/views/group-detail/group-matches-panel";
import { GroupMatchesTable } from "@/views/group-detail/group-matches-table";
import { GroupDetailTeam } from "@/views/group-detail/team";
import {
  ProbabilityMobileOrderbook,
  ProbabilitySection
} from "@/views/trade/team-probability";
import { TeamMobileTradeButtons } from "@/views/trade/team/team-mobile-trade-buttons";
import { useTeamMarketWsTokens } from "@/views/trade/team/use-team-market-ws-tokens";
import { useTeamMobileOutcomePrices } from "@/views/trade/team/use-team-mobile-outcome-prices";
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
  const t = useTranslations("trade");
  const teamTabUnderlineId = `${useId()}-group-team-tab`;
  const tradeWidgetRef = useRef<HTMLDivElement>(null);
  const appliedUrlTeamRef = useRef(false);
  const teamFromUrl = resolveGroupDetailTeamParam(
    searchParams.get("team") ?? undefined
  );
  const sideFromUrl = searchParams.get("side");
  const outcomeSide = useTradeOutcomeSide();
  const setOutcomeSide = useSetTradeOutcomeSide();
  const setTab = useSetTradeTab();
  const setOrderMode = useSetTradeOrderMode();
  const syncTeamSnapshot = useSyncTradeTicketSnapshot();
  const showOrderbook = useShowOrderbook();
  const [tradeDrawerOpen, setTradeDrawerOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(() =>
    resolveInitialSelectedTeamId(initialSnapshots, teamFromUrl)
  );

  const { snapshots, header } = useGroupWinnerMarket({
    group,
    initialSnapshots,
    initialHeader
  });

  const {
    pointsByTeamId,
    matches: groupMatches,
    isLoading: isGroupGameLoading,
    isError: isGroupGameError
  } = useGroupGameData({ group, snapshots });

  const selectedSnapshot = useMemo(
    () =>
      snapshots.find((snapshot) => snapshot.team.id === selectedTeamId) ??
      snapshots[0],
    [selectedTeamId, snapshots]
  );

  const marketWsEnabled = Boolean(
    selectedSnapshot?.market.polymarket?.tokens.yes?.tokenId ||
    selectedSnapshot?.market.polymarket?.tokens.no?.tokenId
  );

  useTeamMarketWsTokens(selectedSnapshot, marketWsEnabled);
  const { yesPrice, noPrice } = useTeamMobileOutcomePrices(
    selectedSnapshot,
    marketWsEnabled
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

  const updateGroupDetailUrl = useCallback(
    (teamId: string, side: OrderOutcomeSide) => {
      router.replace(groupDetailHref(group, { team: teamId, side }), {
        scroll: false
      });
    },
    [group, router]
  );

  const scrollToTradeWidget = useCallback(() => {
    const target =
      tradeWidgetRef.current ??
      document.getElementById(TRADE_BID_BUTTON_ID)?.closest("section");

    target?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const handleSelectTeam = useCallback(
    (teamId: string) => {
      setSelectedTeamId(teamId);
      const snapshot = snapshots.find((entry) => entry.team.id === teamId);

      if (snapshot) {
        syncTeamSnapshot(snapshot);
      }

      updateGroupDetailUrl(teamId, outcomeSide);
    },
    [snapshots, syncTeamSnapshot, updateGroupDetailUrl, outcomeSide]
  );

  const handleOutcomeClick = useCallback(
    (side: OrderOutcomeSide, teamId: string) => {
      updateGroupDetailUrl(teamId, side);
      scrollToTradeWidget();
    },
    [updateGroupDetailUrl, scrollToTradeWidget]
  );

  const openTradeDrawer = useCallback(
    (side: OrderOutcomeSide) => {
      if (!selectedSnapshot) {
        return;
      }

      setOutcomeSide(side);
      setTab("buy");
      setOrderMode("market");
      syncTeamSnapshot(selectedSnapshot);
      updateGroupDetailUrl(selectedTeamId, side);
      setTradeDrawerOpen(true);
    },
    [
      selectedSnapshot,
      selectedTeamId,
      setOutcomeSide,
      setTab,
      setOrderMode,
      syncTeamSnapshot,
      updateGroupDetailUrl
    ]
  );

  if (!selectedSnapshot) {
    return null;
  }

  const drawerTitle = outcomeSide === "yes" ? t("buyYes") : t("buyNo");

  return (
    <div className={cn(tradePageClass, "pb-[130px] md:pb-10")}>
      <div className="flex pt-[10px] flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_345px] xl:items-start">
        <div className="order-2 flex min-w-0 flex-col gap-1 md:gap-4 xl:order-1">
          <GroupDetailHeader
            title={header.title}
            dateRange={header.dateRange}
            volume={header.volume}
            slug={header.slug}
            group={group}
          />

          <section className={groupDetailPanelClass}>
            <div
              role="tablist"
              aria-label={t("winnerProbabilityAria")}
              className="flex items-start justify-around gap-1 px-2 py-4 md:hidden"
            >
              {snapshots.map((snapshot) => (
                <GroupDetailTeam
                  key={snapshot.team.id}
                  snapshot={snapshot}
                  selected={snapshot.team.id === selectedTeamId}
                  onSelect={() => handleSelectTeam(snapshot.team.id)}
                  underlineLayoutId={teamTabUnderlineId}
                />
              ))}
            </div>

            <div className="hidden grid-cols-1 gap-4 p-4 md:grid xl:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)_1px_minmax(0,1fr)_1px_minmax(0,1fr)] xl:items-stretch xl:justify-items-center xl:gap-x-0 xl:p-0">
              {snapshots.flatMap((snapshot, index) => {
                const team = (
                  <GroupDetailTeam
                    key={snapshot.team.id}
                    snapshot={snapshot}
                    selected={snapshot.team.id === selectedTeamId}
                    onSelect={() => handleSelectTeam(snapshot.team.id)}
                    underlineLayoutId={teamTabUnderlineId}
                    tradeInPlace
                    points={pointsByTeamId.get(snapshot.team.id)}
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
                    className="hidden w-px self-stretch bg-prophet-line xl:block"
                    aria-hidden
                  />
                ];
              })}
            </div>

            <div className="border-t border-prophet-line">
              <ProbabilitySection
                snapshot={selectedSnapshot}
                showOrderbook={showOrderbook}
                groupLayout
                borderless
                showChartOrderbookDivider
                hideMobileOrderbook
              />
            </div>
          </section>
          <ProbabilityMobileOrderbook
            snapshot={selectedSnapshot}
            showOrderbook={showOrderbook}
            className="md:hidden"
          />
          <GroupProbabilityChart
            className={cn(groupDetailPanelClass, "my-2 hidden px-4 pb-4 pt-3 md:block")}
            teams={snapshots}
          />
          <GroupMatchesTable
            matches={groupMatches}
            isLoading={isGroupGameLoading}
            isError={isGroupGameError}
          />

          <div className="md:hidden">
            <GroupMatchesPanel
              group={group}
              snapshots={snapshots}
              highlightTeamId={selectedTeamId}
            />
          </div>
        </div>

        <aside className="order-1 hidden min-w-0 flex-col gap-4 md:flex xl:order-2 xl:sticky xl:top-14">
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
          snapshot={selectedSnapshot}
          outcomeButtonClassName="w-full"
          outcomeButtonContainerClassName="gap-3"
          className="border-0 rounded-none"
        />
      </Drawer>
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
