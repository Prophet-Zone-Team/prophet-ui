"use client";

import type { GameMarketSnapshot, TeamMarketSnapshot } from "@/types/market";
import { TradeTicketForm } from "@/views/trade/trade-widget/trade-ticket-form";
import { useTradeTicket } from "@/views/trade/trade-widget/use-trade-ticket";

export type ActionPanelTeamProps = {
  variant?: "team";
  snapshot: TeamMarketSnapshot;
};

export type ActionPanelGameProps = {
  variant: "game";
  gameSnapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
};

export type ActionPanelProps = ActionPanelTeamProps | ActionPanelGameProps;

export function ActionPanel(props: ActionPanelProps & { outcomeButtonClassName?: string; outcomeButtonContainerClassName?: string; }) {
  const ticket = useTradeTicket(
    props.variant === "game"
      ? { variant: "game", gameSnapshot: props.gameSnapshot }
      : { variant: "team", snapshot: props.snapshot }
  );

  if (!ticket) {
    return null;
  }

  return (
    <TradeTicketForm
      {...ticket.formProps}
      outcomeButtonClassName={props.outcomeButtonClassName}
      outcomeButtonContainerClassName={props.outcomeButtonContainerClassName}
    />
  );
}
