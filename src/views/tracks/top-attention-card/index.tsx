"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";

import {
  formatProbability,
  formatVolume
} from "@/components/home/market-formatters";
import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { TeamFlag } from "@/components/teams/team-flag";
import { useAuthOptional } from "@/context/auth";
import { cn } from "@/lib/cn";
import { formatScheduleKickoff } from "@/lib/market/schedule-match";
import { gameTradeHref, teamTradeHref } from "@/lib/routes/trade";
import {
  DEFAULT_FAST_BID_AMOUNT,
  formatFastBidAmountDisplay,
  useConfigHydrated,
  useFastBidAmount,
  useSetTradeOutcomeSide,
  useSyncTradeTicketSnapshot
} from "@/store";
import { useSetTradeMatchOutcomeSide } from "@/store/trade-ticket-store";
import type {
  MatchOutcomeSide,
  OrderOutcomeSide,
  Team,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import { MatchBookmarkControl } from "@/views/home/matches/match-bookmark-control";
import { MarketBookmarkControl } from "@/views/home/winner/market-bookmark-control";
import { gameColors } from "@/views/trade/game/ui";

export type TopAttentionCardBadge =
  | "most_popular"
  | "highest_volume"
  | "dark_horse"
  | "top_probability";

const TOP_ATTENTION_BADGE_STYLES: Record<
  TopAttentionCardBadge,
  { label: string; color: string; backgroundColor: string }
> = {
  most_popular: {
    label: "most popular",
    color: "#FF6BBA",
    backgroundColor: "rgba(255, 107, 186, 0.1)"
  },
  highest_volume: {
    label: "highest volume",
    color: "#3168FF",
    backgroundColor: "rgba(49, 104, 255, 0.1)"
  },
  dark_horse: {
    label: "dark horse",
    color: "#9D84FF",
    backgroundColor: "rgba(157, 132, 255, 0.1)"
  },
  top_probability: {
    label: "top probability",
    color: "#65AF14",
    backgroundColor: "rgba(101, 175, 20, 0.1)"
  }
};

const MATCH_OUTCOME_BUTTON_STYLES: Record<
  MatchOutcomeSide,
  { label: string; background: string }
> = {
  home: { label: "Win", background: gameColors.home },
  draw: { label: "Draw", background: gameColors.draw },
  away: { label: "Loss", background: gameColors.awayBar }
};

export type TopAttentionTeamCardProps = {
  variant?: "team";
  snapshot: TeamMarketSnapshot;
  attention?: number;
  categoryLabel?: string;
  badge?: TopAttentionCardBadge;
  className?: string;
};

export type TopAttentionMatchCardProps = {
  variant: "match";
  match: WorldCupMatch;
  homeTeam: Team;
  awayTeam: Team;
  attention?: number;
  volume: number;
  probability: number;
  className?: string;
};

export type TopAttentionCardProps =
  | TopAttentionTeamCardProps
  | TopAttentionMatchCardProps;

const labelClassName = "text-[12px] font-[400] leading-[15px] text-[#909090]";
const valueClassName =
  "text-[18px] font-[500] leading-[23px] text-black mt-[2px]";

const cardClassName =
  "box-border flex h-auto min-h-[214px] w-full max-w-[345px] flex-col rounded-[12px] border border-[#EBEBEB] bg-white px-3 py-3 md:px-4 md:py-4";

const cardInteractiveClassName =
  "cursor-pointer transition-colors hover:border-[#d0d0d0] hover:bg-[#fafbfc]";

function formatAttention(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export function TopAttentionCard(props: TopAttentionCardProps) {
  if (props.variant === "match") {
    return <TopAttentionMatchCard {...props} />;
  }

  return <TopAttentionTeamCard {...props} />;
}

function TopAttentionTeamCard({
  snapshot,
  attention,
  categoryLabel = "FIFA World Cup",
  badge,
  className
}: TopAttentionTeamCardProps) {
  const router = useRouter();
  const { team, market } = snapshot;
  const tradeHref = teamTradeHref(team.id);
  const volumeLabel = `$${formatVolume(market.volume)}`;
  const attentionLabel =
    attention !== undefined ? `🔥${formatAttention(attention)}` : undefined;

  function navigateToTrade() {
    router.push(tradeHref);
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToTrade();
    }
  }

  return (
    <article
      role="link"
      tabIndex={0}
      className={cn(cardClassName, cardInteractiveClassName, className)}
      aria-label={`Open trade page for ${team.name}`}
      onClick={navigateToTrade}
      onKeyDown={handleCardKeyDown}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 text-[12px] font-[400] capitalize leading-[15px] text-[#909090]">
          {categoryLabel}
        </p>
        <MarketBookmarkControl
          slug={market.polymarket?.slug || ""}
          teamName={team.name}
        />
      </div>

      <div className="mt-2 flex min-w-0 items-center gap-2">
        <TeamFlag
          code={team.code}
          name={team.name}
          className="h-[26px] w-[26px] shrink-0 rounded-[4px] text-[26px]"
        />
        <h3 className="m-0 truncate text-[16px] font-[500] leading-[20px] text-black">
          {team.name}
        </h3>
        {badge ? <TopAttentionBadge badge={badge} /> : null}
      </div>

      <TopAttentionStatsRow
        probability={formatProbability(market.probability)}
        volume={volumeLabel}
        attention={attentionLabel}
      />

      <div
        className="grid grid-cols-2 gap-2.5"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <OutcomeQuickBidButton snapshot={snapshot} side="yes" />
        <OutcomeQuickBidButton snapshot={snapshot} side="no" />
      </div>
    </article>
  );
}

function TopAttentionMatchCard({
  match,
  homeTeam,
  awayTeam,
  attention,
  volume,
  probability,
  className
}: TopAttentionMatchCardProps) {
  const router = useRouter();
  const kickoffLabel = formatScheduleKickoff(match.kickoffAt);
  const volumeLabel = `$${formatVolume(volume)}`;
  const attentionLabel =
    attention !== undefined ? `🔥${formatAttention(attention)}` : undefined;
  const matchTitle = `${homeTeam.name} vs ${awayTeam.name}`;
  const tradeHref = gameTradeHref(match.id);

  function navigateToTrade() {
    router.push(tradeHref);
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToTrade();
    }
  }

  return (
    <article
      role="link"
      tabIndex={0}
      className={cn(cardClassName, cardInteractiveClassName, className)}
      aria-label={`Open trade page for ${matchTitle}`}
      onClick={navigateToTrade}
      onKeyDown={handleCardKeyDown}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 text-[12px] font-[400] leading-[15px] text-[#909090]">
          {kickoffLabel}
        </p>
        <MatchBookmarkControl
          matchId={match.id}
          homeTeamName={homeTeam.name}
          awayTeamName={awayTeam.name}
        />
      </div>

      <div className="mt-2 flex min-w-0 items-center gap-2">
        <div className="flex shrink-0 items-center gap-[4px]">
          <TeamFlag
            code={homeTeam.code}
            name={homeTeam.name}
            className="relative z-[1] h-[26px] w-[26px] rounded-[4px] text-[26px]"
          />
          <TeamFlag
            code={awayTeam.code}
            name={awayTeam.name}
            className="relative h-[26px] w-[26px] rounded-[4px] text-[26px]"
          />
        </div>
        <h3 className="m-0 min-w-0 truncate text-[16px] font-[500] leading-[20px] text-black">
          {matchTitle}
        </h3>
      </div>

      <TopAttentionStatsRow
        probability={formatProbability(probability)}
        volume={volumeLabel}
        attention={attentionLabel}
      />

      <div
        className="grid grid-cols-3 gap-2"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {(["home", "draw", "away"] as const).map((outcomeSide) => (
          <MatchOutcomeQuickBidButton
            key={outcomeSide}
            matchId={match.id}
            outcomeSide={outcomeSide}
            label={resolveMatchOutcomeButtonLabel(outcomeSide)}
            background={MATCH_OUTCOME_BUTTON_STYLES[outcomeSide].background}
            matchLabel={matchTitle}
          />
        ))}
      </div>
    </article>
  );
}

function resolveMatchOutcomeButtonLabel(outcomeSide: MatchOutcomeSide): string {
  return MATCH_OUTCOME_BUTTON_STYLES[outcomeSide].label;
}

function TopAttentionStatsRow({
  probability,
  volume,
  attention
}: {
  probability: string;
  volume: string;
  attention?: string;
}) {
  return (
    <div
      className={cn(
        "mt-6 grid flex-1 items-start gap-2",
        attention ? "grid-cols-3" : "grid-cols-2"
      )}
    >
      <StatColumn label="Probability" value={probability} />
      <StatColumn label="Volume" value={volume} />
      {attention ? (
        <StatColumn label="Attention" value={attention} align="center" />
      ) : null}
    </div>
  );
}

function TopAttentionBadge({ badge }: { badge: TopAttentionCardBadge }) {
  const style = TOP_ATTENTION_BADGE_STYLES[badge];

  return (
    <span
      className="shrink-0 rounded-[10px] px-2 py-0.5 text-[12px] font-[400] capitalize leading-[15px]"
      style={{
        color: style.color,
        backgroundColor: style.backgroundColor
      }}
    >
      {style.label}
    </span>
  );
}

function StatColumn({
  label,
  value,
  align = "start"
}: {
  label: string;
  value: string;
  align?: "start" | "center";
}) {
  const alignmentClassName = align === "center" ? "text-center" : "text-left";

  return (
    <div className={cn("min-w-0", alignmentClassName)}>
      <p className={cn("m-0 mt-0.5", labelClassName)}>{label}</p>
      <p className={cn("m-0", valueClassName)}>{value}</p>
    </div>
  );
}

function MatchOutcomeQuickBidButton({
  matchId,
  outcomeSide,
  label,
  background,
  matchLabel
}: {
  matchId: string;
  outcomeSide: MatchOutcomeSide;
  label: string;
  background: string;
  matchLabel: string;
}) {
  const router = useRouter();
  const auth = useAuthOptional();
  const fastBidAmount = useFastBidAmount();
  const hasHydrated = useConfigHydrated();
  const setMatchOutcomeSide = useSetTradeMatchOutcomeSide();
  const isRegionBlocked = auth?.isRegionBlocked ?? false;
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const regionRestricted = isAuthenticated && isRegionBlocked;
  const displayAmount = hasHydrated ? fastBidAmount : DEFAULT_FAST_BID_AMOUNT;
  const amountLabel = formatFastBidAmountDisplay(displayAmount);
  const outcomeLabel = MATCH_OUTCOME_BUTTON_STYLES[outcomeSide].label;
  const buttonLabel = `${label} ${amountLabel}`;

  function handleClick() {
    if (regionRestricted) {
      return;
    }

    setMatchOutcomeSide(outcomeSide);
    router.push(gameTradeHref(matchId));
  }

  const button = (
    <button
      type="button"
      disabled={regionRestricted}
      aria-label={`${outcomeLabel} on ${matchLabel} at ${buttonLabel}`}
      onClick={handleClick}
      className={cn(
        "inline-flex h-10 w-full items-center justify-center rounded-[8px]",
        "truncate px-1 text-[14px] font-[500] leading-[18px] text-white",
        "disabled:cursor-not-allowed disabled:opacity-70"
      )}
      style={{ backgroundColor: background }}
    >
      {buttonLabel}
    </button>
  );

  return (
    <RegionRestrictedControl restricted={regionRestricted}>
      {button}
    </RegionRestrictedControl>
  );
}

function OutcomeQuickBidButton({
  snapshot,
  side
}: {
  snapshot: TeamMarketSnapshot;
  side: OrderOutcomeSide;
}) {
  const router = useRouter();
  const auth = useAuthOptional();
  const fastBidAmount = useFastBidAmount();
  const hasHydrated = useConfigHydrated();
  const syncTeamSnapshot = useSyncTradeTicketSnapshot();
  const setOutcomeSide = useSetTradeOutcomeSide();
  const isRegionBlocked = auth?.isRegionBlocked ?? false;
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const regionRestricted = isAuthenticated && isRegionBlocked;
  const displayAmount = hasHydrated ? fastBidAmount : DEFAULT_FAST_BID_AMOUNT;
  const isYes = side === "yes";
  const amountLabel = formatFastBidAmountDisplay(displayAmount);
  const buttonLabel = `${isYes ? "YES" : "NO"} ${amountLabel}`;

  function handleClick() {
    if (regionRestricted) {
      return;
    }

    syncTeamSnapshot(snapshot);
    setOutcomeSide(side);
    router.push(teamTradeHref(snapshot.team.id));
  }

  const button = (
    <button
      type="button"
      disabled={regionRestricted}
      aria-label={`${isYes ? "Yes" : "No"} trade ${amountLabel} on ${snapshot.team.name}`}
      onClick={handleClick}
      className={cn(
        "inline-flex h-10 w-full items-center justify-center rounded-[8px]",
        "text-[14px] font-[500] leading-[18px] text-white",
        "disabled:cursor-not-allowed disabled:opacity-70",
        isYes ? "bg-[#65AF14]" : "bg-[#FF674B]"
      )}
    >
      {buttonLabel}
    </button>
  );

  return (
    <RegionRestrictedControl restricted={regionRestricted}>
      {button}
    </RegionRestrictedControl>
  );
}
