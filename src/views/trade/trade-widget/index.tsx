"use client";

import { useEffect } from "react";

import { TabSwitcher } from "@/components/ui/tab-switcher";
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

export function TradeWidget(props: TradeWidgetProps & { className?: string; }) {
  const syncForTeamSnapshot = useSyncTradeTeamSnapshot();
  const syncForGameSnapshot = useSyncTradeGameSnapshot();
  const outcomeSide = useTradeOutcomeSide();
  const matchOutcomeSide = useTradeMatchOutcomeSide();
  const tab = useTradeTab();
  const orderMode = useTradeOrderMode();
  const setTab = useSetTradeTab();
  const setOrderMode = useSetTradeOrderMode();

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
    <section className={cn(tradePanelClass, props.className)} aria-label="Place order">
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
            onChange={(value) => setTab(value as typeof tab)}
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
        />
      ) : (
        <ActionPanel snapshot={props.snapshot} />
      )}
    </section>
  );
}
