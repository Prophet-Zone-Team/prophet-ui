"use client";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import {
  resolveTradeWidgetHeaderIconKind,
  resolveTradeWidgetHeaderTitle
} from "@/lib/market/trade-widget-header";
import {
  useSelectedFixtureOutcome,
  useTradeOutcomeSide
} from "@/store/trade-ticket-store";
import { FixtureOutcomeSplitIcon } from "@/views/trade/trade-widget/fixture-outcome-split-icon";
import type {
  FixtureMarketOutcome,
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

function resolveFixtureOutcomeLabel(outcome: FixtureMarketOutcome): string {
  if (outcome.marketType === "halftime") {
    return `HT ${outcome.label}`;
  }

  if (outcome.marketType === "exact_score") {
    return outcome.label;
  }

  if (outcome.marketType === "total" || outcome.marketType === "spread") {
    return outcome.label;
  }

  if (outcome.marketType === "btts") {
    return "Both Teams to Score";
  }

  return outcome.label;
}

function TradeWidgetHeaderIcon({
  iconKind,
  homeCode,
  homeName,
  awayCode,
  awayName
}: {
  iconKind: ReturnType<typeof resolveTradeWidgetHeaderIconKind>;
  homeCode?: string;
  homeName: string;
  awayCode?: string;
  awayName: string;
}) {
  const flagClassName =
    "!h-9 !w-9 shrink-0 rounded-md shadow-[0_0_2px_rgba(0,0,0,0.2)]";

  if (iconKind.kind === "none") {
    return null;
  }

  if (iconKind.kind === "draw") {
    return <MatchPlaceholderIcon />;
  }

  if (iconKind.kind === "split") {
    return (
      <FixtureOutcomeSplitIcon
        variant={iconKind.variant}
        activeSide={iconKind.activeSide}
      />
    );
  }

  const team =
    iconKind.side === "home"
      ? { code: homeCode, name: homeName }
      : { code: awayCode, name: awayName };

  return <TeamFlag code={team.code} name={team.name} className={flagClassName} />;
}

export function TradeWidgetHeader(props: TradeWidgetHeaderProps) {
  const selectedFixtureOutcome = useSelectedFixtureOutcome();
  const tradeOutcomeSide = useTradeOutcomeSide();

  if (props.variant === "game") {
    const { showOutcomeLabel = true } = props;
    const sides = resolveMatchSides(props.gameSnapshot.match, props.teamSnapshots);
    const outcomeLabel = selectedFixtureOutcome
      ? resolveFixtureOutcomeLabel(selectedFixtureOutcome)
      : resolveGameOutcomeLabel(
          props.matchOutcomeSide,
          sides.home.name,
          sides.away.name
        );
    const headerTitle = resolveTradeWidgetHeaderTitle(
      selectedFixtureOutcome,
      sides.home.name,
      sides.away.name
    );
    const iconKind = resolveTradeWidgetHeaderIconKind(
      selectedFixtureOutcome,
      props.matchOutcomeSide,
      tradeOutcomeSide
    );
    const showHeaderIcon = iconKind.kind !== "none";

    return (
      <div
        className={cn(
          "flex items-start px-4 pt-4",
          showHeaderIcon ? "gap-2.5" : "gap-0"
        )}
      >
        <TradeWidgetHeaderIcon
          iconKind={iconKind}
          homeCode={sides.home.code}
          homeName={sides.home.name}
          awayCode={sides.away.code}
          awayName={sides.away.name}
        />
        <div className="min-w-0 flex-1">
          <p className="m-0 line-clamp-2 text-[14px] font-[500] leading-[17px] text-black">
            {headerTitle}
          </p>
          {showOutcomeLabel ? (
            <p
              className={cn(
                "m-0 mt-0.5 text-[16px] font-[500] leading-[19px]",
                tradeOutcomeSide === "no" ? "text-[#FF674B]" : "text-[#65AF14]"
              )}
            >
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
        className="!h-[36px] !w-[36px] shrink-0 rounded-md shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />
      <div className="min-w-0 flex-1">
        <p className="m-0 line-clamp-2 text-[14px] font-[500] leading-[17px] text-black">
          {question}
        </p>
        {showOutcomeLabel ? (
          <p
            className={cn(
              "m-0 mt-0.5 text-[16px] font-[500] leading-[19px]",
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
