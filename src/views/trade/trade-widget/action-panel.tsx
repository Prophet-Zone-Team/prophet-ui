"use client";

import { useMemo } from "react";

import { useSelectedFixtureOutcome } from "@/store/trade-ticket-store";
import type { GameFixtureMarketsSnapshot, GameMarketSnapshot, TeamMarketSnapshot } from "@/types/market";
import { TradeTicketForm } from "@/views/trade/trade-widget/trade-ticket-form";
import { useTradeTicket } from "@/views/trade/trade-widget/use-trade-ticket";
import { ZettaWalletInsight } from "@/views/trade/trade-widget/zetta";

export type ActionPanelTeamProps = {
  variant?: "team";
  snapshot: TeamMarketSnapshot;
};

export type ActionPanelGameProps = {
  variant: "game";
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets?: GameFixtureMarketsSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
};

export type ActionPanelProps = ActionPanelTeamProps | ActionPanelGameProps;

function useTradeWidgetWalletInsight(props: ActionPanelProps) {
  const selectedFixtureOutcome = useSelectedFixtureOutcome();

  return useMemo(() => {
    if (props.variant === "game") {
      const isMoneyline =
        !selectedFixtureOutcome ||
        selectedFixtureOutcome.marketType === "moneyline";

      if (!isMoneyline) {
        return null;
      }

      return (
        <ZettaWalletInsight
          variant="game"
          gameSnapshot={props.gameSnapshot}
          teamSnapshots={props.teamSnapshots}
          className="mx-0 w-full max-w-none"
        />
      );
    }

    return (
      <ZettaWalletInsight
        snapshot={props.snapshot}
        className="mx-0 w-full max-w-none"
      />
    );
  }, [props, selectedFixtureOutcome]);
}

export function ActionPanel(props: ActionPanelProps & { outcomeButtonClassName?: string; outcomeButtonContainerClassName?: string; }) {
  const ticket = useTradeTicket(
    props.variant === "game"
      ? {
          variant: "game",
          gameSnapshot: props.gameSnapshot,
          fixtureMarkets: props.fixtureMarkets,
        }
      : { variant: "team", snapshot: props.snapshot }
  );
  const walletInsight = useTradeWidgetWalletInsight(props);

  if (!ticket) {
    return null;
  }

  return (
    <TradeTicketForm
      {...ticket.formProps}
      walletInsight={walletInsight}
      outcomeButtonClassName={props.outcomeButtonClassName}
      outcomeButtonContainerClassName={props.outcomeButtonContainerClassName}
    />
  );
}
