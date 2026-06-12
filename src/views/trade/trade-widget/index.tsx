"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";

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
import type { GameFixtureMarketsSnapshot, GameMarketSnapshot, TeamMarketSnapshot } from "@/types/market";
import { ActionPanel } from "@/views/trade/trade-widget/action-panel";
import { TradeWidgetHeader } from "@/views/trade/trade-widget/header";
import { TradeMarketButton } from "@/views/trade/trade-widget/trade-market-button";
import { tradePanelClass } from "@/views/trade/trade-widget/trade-ui";
import { cn } from "@/lib/cn";

export type TradeWidgetTeamProps = {
  variant?: "team";
  snapshot: TeamMarketSnapshot;
};

export type TradeWidgetGameProps = {
  variant: "game";
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets?: GameFixtureMarketsSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
};

export type TradeWidgetProps = TradeWidgetTeamProps | TradeWidgetGameProps;

export function TradeWidget(props: TradeWidgetProps & { className?: string; outcomeButtonClassName?: string; outcomeButtonContainerClassName?: string; }) {
  const t = useTranslations("trade");
  const tradeTabs = useMemo(
    () => [
      { id: "buy" as const, label: t("buy") },
      { id: "sell" as const, label: t("sell") }
    ],
    [t]
  );
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
    <section className={cn(tradePanelClass, props.className)} aria-label={t("placeOrder")}>
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
            items={tradeTabs}
            value={tab}
            onChange={(value) => setTab(value as typeof tab)}
            size="compact"
            aria-label={t("tradeSide")}
            className="h-[25px]"
          />
        </div>
        <TradeMarketButton value={orderMode} onChange={setOrderMode} />
      </div>

      {props.variant === "game" ? (
        <ActionPanel
          variant="game"
          gameSnapshot={props.gameSnapshot}
          fixtureMarkets={props.variant === "game" ? props.fixtureMarkets : undefined}
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
