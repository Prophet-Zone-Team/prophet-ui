"use client";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import type {
  GameMarketSnapshot,
  MatchOutcomeSide,
  OrderOutcomeSide,
  TeamMarketSnapshot
} from "@/types/market";

type TradeWidgetHeaderBaseProps = {
  showOutcomeLabel?: boolean;
};

export type TradeWidgetHeaderTeamProps = TradeWidgetHeaderBaseProps & {
  variant?: "team";
  snapshot: TeamMarketSnapshot;
  outcomeSide?: OrderOutcomeSide;
};

export type TradeWidgetHeaderGameProps = TradeWidgetHeaderBaseProps & {
  variant: "game";
  gameSnapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
  matchOutcomeSide: MatchOutcomeSide;
};

export type TradeWidgetHeaderProps =
  | TradeWidgetHeaderTeamProps
  | TradeWidgetHeaderGameProps;

function MatchPlaceholderIcon() {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#E8E8E8] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      aria-hidden
    >
      <div className="flex flex-col gap-[3px]">
        <span className="block h-[2px] w-4 rounded-full bg-black" />
        <span className="block h-[2px] w-4 rounded-full bg-black" />
      </div>
    </div>
  );
}

function resolveGameOutcomeLabel(
  matchOutcomeSide: MatchOutcomeSide,
  homeName: string,
  awayName: string
): string {
  if (matchOutcomeSide === "draw") {
    return "Draw";
  }

  if (matchOutcomeSide === "away") {
    return awayName;
  }

  return homeName;
}

export function TradeWidgetHeader(props: TradeWidgetHeaderProps) {
  if (props.variant === "game") {
    const sides = resolveMatchSides(props.gameSnapshot.match, props.teamSnapshots);
    const outcomeLabel = resolveGameOutcomeLabel(
      props.matchOutcomeSide,
      sides.home.name,
      sides.away.name
    );

    return (
      <div className="flex items-start gap-2.5 px-4 pt-4">
        <MatchPlaceholderIcon />
        <div className="min-w-0 flex-1">
          <p className="m-0 line-clamp-2 text-sm font-[556] leading-[17px] text-prophet-muted">
            {sides.home.name} vs {sides.away.name}
          </p>
          {props.showOutcomeLabel ? (
            <p className="m-0 mt-0.5 text-base font-[556] leading-[19px] text-black">
              {outcomeLabel}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const { snapshot, outcomeSide = "yes", showOutcomeLabel = true } = props;
  const question =
    snapshot.market.polymarket?.question ??
    `Will ${snapshot.team.name} win the World Cup?`;

  return (
    <div className="flex items-start gap-2.5 px-4 pt-4">
      <TeamFlag
        code={snapshot.team.code}
        name={snapshot.team.name}
        className="!h-9 !w-9 shrink-0 rounded-md shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />
      <div className="min-w-0 flex-1">
        <p className="m-0 line-clamp-2 text-sm font-[556] leading-[17px] text-black">
          {question}
        </p>
        {showOutcomeLabel ? (
          <p
            className={cn(
              "m-0 mt-0.5 text-base font-[556] leading-[19px]",
              outcomeSide === "yes" ? "text-[#65AF14]" : "text-[#FF674B]"
            )}
          >
            {outcomeSide === "yes" ? "Yes" : "No"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
