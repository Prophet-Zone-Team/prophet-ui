"use client";

import { useEffect } from "react";

import { useAnalyticsImpression } from "@/hooks/analytics/use-analytics-impression";
import { TabSwitcher } from "@/components/ui/tab-switcher";
import {
  trackMarketTabChanged,
  trackOrderTicketOpened
} from "@/lib/analytics/tracking";
import { resolveTradeAnalyticsContext } from "@/lib/analytics/tracking/resolve-trade-context";
import {
  useSetTradeOrderMode,
  useSetTradeTab,
  useSyncTradeGameSnapshot,
  useSyncTradeTeamSnapshot,
  useTradeMatchOutcomeSide,
  useTradeOrderMode,
  useTradeOutcomeSide,
  useTradeTab
} from "@/store/trade-ticket-store";
import type { GameMarketSnapshot, TeamMarketSnapshot } from "@/types/market";
import { ActionPanel } from "@/views/trade/trade-widget/action-panel";
import { TradeWidgetHeader } from "@/views/trade/trade-widget/header";
import { TradeMarketButton } from "@/views/trade/trade-widget/trade-market-button";
import { tradePanelClass } from "@/views/trade/trade-widget/trade-ui";
import { cn } from "@/lib/cn";

const TRADE_TABS = [
  { id: "buy", label: "Buy" },
  { id: "sell", label: "Sell" }
] as const;

export type TradeWidgetTeamProps = {
  variant?: "team";
  snapshot: TeamMarketSnapshot;
};

export type TradeWidgetGameProps = {
  variant: "game";
  gameSnapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
};

export type TradeWidgetProps = TradeWidgetTeamProps | TradeWidgetGameProps;

export function TradeWidget(props: TradeWidgetProps & { className?: string; outcomeButtonClassName?: string; outcomeButtonContainerClassName?: string; }) {
  const syncForTeamSnapshot = useSyncTradeTeamSnapshot();
  const syncForGameSnapshot = useSyncTradeGameSnapshot();
  const outcomeSide = useTradeOutcomeSide();
  const matchOutcomeSide = useTradeMatchOutcomeSide();
  const tab = useTradeTab();
  const orderMode = useTradeOrderMode();
  const setTab = useSetTradeTab();
  const setOrderMode = useSetTradeOrderMode();

  const teamSnapshot = props.variant === "game" ? undefined : props.snapshot;
  const bidAreaRef = useAnalyticsImpression<HTMLElement>({
    eventName: "bid_area_viewed",
    dedupeKey:
      props.variant === "game"
        ? `bid_area:game:${props.gameSnapshot.match.id}`
        : `bid_area:team:${props.snapshot.team.id}`,
    payload: {
      teamId: teamSnapshot?.team.id,
      teamName: teamSnapshot?.team.name,
      marketId: teamSnapshot?.market.polymarket?.conditionId
    }
  });

  useEffect(() => {
    trackOrderTicketOpened(
      props.variant === "game"
        ? resolveTradeAnalyticsContext({
            variant: "game",
            gameSnapshot: props.gameSnapshot
          })
        : resolveTradeAnalyticsContext({
            variant: "team",
            snapshot: props.snapshot
          })
    );
  }, [props.variant, props.variant === "game" ? props.gameSnapshot.match.id : props.snapshot.team.id]);

  useEffect(() => {
    if (props.variant === "game") {
      syncForGameSnapshot(props.gameSnapshot);
      return;
    }

    syncForTeamSnapshot(props.snapshot);
  }, [
    props.variant,
    props.variant === "game" ? props.gameSnapshot : props.snapshot,
    syncForGameSnapshot,
    syncForTeamSnapshot
  ]);

  return (
    <section
      ref={bidAreaRef}
      className={cn(tradePanelClass, props.className)}
      aria-label="Place order"
    >
      {props.variant === "game" ? (
        <TradeWidgetHeader
          variant="game"
          gameSnapshot={props.gameSnapshot}
          teamSnapshots={props.teamSnapshots}
          matchOutcomeSide={matchOutcomeSide}
        />
      ) : (
        <TradeWidgetHeader
          snapshot={props.snapshot}
          outcomeSide={outcomeSide}
        />
      )}

      <div className="flex items-end justify-between gap-3 px-4 pt-3">
        <div className="border-b border-[#EBEBEB] flex-1">
          <TabSwitcher
            items={[...TRADE_TABS]}
            value={tab}
            onChange={(value) => {
              trackMarketTabChanged({
                fromRange: tab,
                toRange: value,
                target: value,
                label: TRADE_TABS.find((item) => item.id === value)?.label,
                section: "trade_widget_tabs"
              });
              setTab(value as typeof tab);
            }}
            size="compact"
            aria-label="Trade side"
            className="h-[25px]"
          />
        </div>
        <TradeMarketButton value={orderMode} onChange={setOrderMode} />
      </div>

      {props.variant === "game" ? (
        <ActionPanel
          variant="game"
          gameSnapshot={props.gameSnapshot}
          teamSnapshots={props.teamSnapshots}
          outcomeButtonClassName={props.outcomeButtonClassName}
          outcomeButtonContainerClassName={props.outcomeButtonContainerClassName}
        />
      ) : (
        <ActionPanel
          snapshot={props.snapshot}
          outcomeButtonClassName={props.outcomeButtonClassName}
          outcomeButtonContainerClassName={props.outcomeButtonContainerClassName}
        />
      )}
    </section>
  );
}
