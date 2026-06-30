"use client";

import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { cn } from "@/lib/cn";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import { resolveTradeWidgetHeaderIconKind } from "@/lib/market/trade-widget-header";
import {
  useSelectedFixtureOutcome,
  useTradeOutcomeSide
} from "@/store/trade-ticket-store";
import { FixtureOutcomeSplitIcon } from "@/views/trade/trade-widget/fixture-outcome-split-icon";
import {
  resolveFixtureOutcomeLabel,
  resolveGameOutcomeLabel,
  resolveTradeWidgetHeaderTitle
} from "@/views/trade/trade-widget/trade-i18n";
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
    "!h-9 !w-9 shrink-0 rounded-md";

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
  const t = useTranslations("trade");
  const selectedFixtureOutcome = useSelectedFixtureOutcome();
  const tradeOutcomeSide = useTradeOutcomeSide();
  const isGameVariant = props.variant === "game";
  const teamSnapshot = isGameVariant ? undefined : props.snapshot;
  const gameSides = isGameVariant
    ? resolveMatchSides(props.gameSnapshot.match, props.teamSnapshots)
    : undefined;
  const teamName = useLocalizedTeamName(
    teamSnapshot?.team.code,
    teamSnapshot?.team.name
  );
  const homeName = useLocalizedTeamName(
    gameSides?.home.code,
    gameSides?.home.name
  );
  const awayName = useLocalizedTeamName(
    gameSides?.away.code,
    gameSides?.away.name
  );

  if (isGameVariant) {
    const { showOutcomeLabel = true } = props;
    const outcomeLabel = selectedFixtureOutcome
      ? resolveFixtureOutcomeLabel(t, selectedFixtureOutcome)
      : resolveGameOutcomeLabel(
          t,
          props.matchOutcomeSide,
          homeName,
          awayName
        );
    const headerTitle = resolveTradeWidgetHeaderTitle(
      t,
      selectedFixtureOutcome,
      homeName,
      awayName
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
          homeCode={gameSides?.home.code}
          homeName={homeName}
          awayCode={gameSides?.away.code}
          awayName={awayName}
        />
        <div className="min-w-0 flex-1">
          <p className="m-0 line-clamp-2 text-[14px] font-[500] leading-[17px] text-prophet-foreground">
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

  const { outcomeSide = "yes", showOutcomeLabel = true } = props;
  const question =
    props.snapshot.market.polymarket?.question ??
    t("teamWinQuestion", { teamName });

  return (
    <div className="flex items-start gap-2.5 px-4 pt-4">
      <TeamFlag
        code={props.snapshot.team.code}
        name={teamName}
        className="!h-[36px] !w-[36px] shrink-0 rounded-md"
      />
      <div className="min-w-0 flex-1">
        <p className="m-0 line-clamp-2 text-[14px] font-[500] leading-[17px] text-prophet-foreground">
          {question}
        </p>
        {showOutcomeLabel ? (
          <p
            className={cn(
              "m-0 mt-0.5 text-[16px] font-[500] leading-[19px]",
              outcomeSide === "yes" ? "text-[#65AF14]" : "text-[#FF674B]"
            )}
          >
            {outcomeSide === "yes" ? t("yes") : t("no")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
