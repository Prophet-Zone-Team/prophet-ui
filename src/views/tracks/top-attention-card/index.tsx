"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import {
  formatProbability,
  formatVolume
} from "@/components/home/market-formatters";
import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { TeamFlag } from "@/components/teams/team-flag";
import { useAuthOptional } from "@/context/auth";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { cn } from "@/lib/cn";
import { formatOrderbookPrice } from "@/lib/market/order-math";
import { formatScheduleKickoff } from "@/lib/market/schedule-match";
import { gameTradeHref, teamTradeHref } from "@/lib/routes/trade";
import {
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
import { getTeamSimpleSidePrice } from "@/views/trade/game/market-section/format-bid-label";

type TopAttentionBadgeStyleKey =
  | "most_popular"
  | "highest_volume"
  | "dark_horse"
  | "top_probability";

const TOP_ATTENTION_BADGE_STYLES: Record<
  TopAttentionBadgeStyleKey,
  { color: string; backgroundColor: string }
> = {
  most_popular: {
    color: "#FF6BBA",
    backgroundColor: "rgba(255, 107, 186, 0.1)"
  },
  highest_volume: {
    color: "#3168FF",
    backgroundColor: "rgba(49, 104, 255, 0.1)"
  },
  dark_horse: {
    color: "#9D84FF",
    backgroundColor: "rgba(157, 132, 255, 0.1)"
  },
  top_probability: {
    color: "#65AF14",
    backgroundColor: "rgba(101, 175, 20, 0.1)"
  }
};

const DEFAULT_TOP_ATTENTION_BADGE_STYLE = {
  color: "#909090",
  backgroundColor: "rgba(144, 144, 144, 0.1)"
};

function resolveTopAttentionBadgeStyleKey(
  label: string
): TopAttentionBadgeStyleKey | undefined {
  const normalized = label.trim().toLowerCase().replace(/\s+/g, "_");

  if (normalized in TOP_ATTENTION_BADGE_STYLES) {
    return normalized as TopAttentionBadgeStyleKey;
  }

  return undefined;
}

function resolveTopAttentionBadgeStyle(label: string) {
  const key = resolveTopAttentionBadgeStyleKey(label);

  return key
    ? TOP_ATTENTION_BADGE_STYLES[key]
    : DEFAULT_TOP_ATTENTION_BADGE_STYLE;
}

const MATCH_OUTCOME_BUTTON_BACKGROUNDS: Record<MatchOutcomeSide, string> = {
  home: gameColors.home,
  draw: gameColors.draw,
  away: gameColors.awayBar
};

const TOP_ATTENTION_BADGE_MESSAGE_KEYS: Record<
  TopAttentionBadgeStyleKey,
  "badgeMostPopular" | "badgeHighestVolume" | "badgeDarkHorse" | "badgeTopProbability"
> = {
  most_popular: "badgeMostPopular",
  highest_volume: "badgeHighestVolume",
  dark_horse: "badgeDarkHorse",
  top_probability: "badgeTopProbability"
};

export type TopAttentionTeamCardProps = {
  variant?: "team";
  snapshot: TeamMarketSnapshot;
  attention?: number;
  categoryLabel?: string;
  /** Badge labels from GET /v1/user/tracks/top `categories` (e.g. "Most Popular"). */
  badges?: string[];
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
  outcomePrices?: Partial<Record<MatchOutcomeSide, number>>;
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

function useLocalizedTopAttentionBadge(label: string): string {
  const t = useTranslations("tracks");
  const key = resolveTopAttentionBadgeStyleKey(label);

  return key ? t(TOP_ATTENTION_BADGE_MESSAGE_KEYS[key]) : label;
}

function useMatchOutcomeLabel(outcomeSide: MatchOutcomeSide): string {
  const t = useTranslations("tracks");

  if (outcomeSide === "home") {
    return t("matchOutcomeWin");
  }

  if (outcomeSide === "draw") {
    return t("matchOutcomeDraw");
  }

  return t("matchOutcomeLoss");
}

function TopAttentionTeamCard({
  snapshot,
  attention,
  categoryLabel,
  badges,
  className
}: TopAttentionTeamCardProps) {
  const t = useTranslations("tracks");
  const router = useRouter();
  const { team, market } = snapshot;
  const displayName = useLocalizedTeamName(team.code, team.name);
  const tradeHref = teamTradeHref(market?.slug || "");
  const volumeLabel = `$${formatVolume(market.volume)}`;
  const resolvedCategoryLabel = categoryLabel ?? t("categoryFifaWorldCup");

  const attentionLabel =
    attention !== undefined ? `🔥${formatAttention(attention)}` : undefined;

  function navigateToTrade() {
   if (market?.slug) router.push(tradeHref);
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
      aria-label={t("openTradePageFor", { name: displayName })}
      onClick={navigateToTrade}
      onKeyDown={handleCardKeyDown}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 text-[12px] font-[400] capitalize leading-[15px] text-[#909090]">
          {resolvedCategoryLabel}
        </p>
        <MarketBookmarkControl
          slug={market.polymarket?.slug || ""}
          teamName={displayName}
        />
      </div>

      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <TeamFlag
          code={team.code}
          name={displayName}
          className="h-[26px] w-[26px] shrink-0 rounded-[4px] text-[26px]"
        />
        <h3 className="m-0 min-w-0 truncate text-[16px] font-[500] leading-[20px] text-black">
          {displayName}
        </h3>
        {badges?.map((label) => (
          <TopAttentionBadge key={label} label={label} />
        ))}
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
  outcomePrices,
  className
}: TopAttentionMatchCardProps) {
  const t = useTranslations("tracks");
  const router = useRouter();
  const homeDisplayName = useLocalizedTeamName(homeTeam.code, homeTeam.name);
  const awayDisplayName = useLocalizedTeamName(awayTeam.code, awayTeam.name);
  const kickoffLabel = formatScheduleKickoff(match.kickoffAt);
  const volumeLabel = `$${formatVolume(volume)}`;
  const attentionLabel =
    attention !== undefined ? `🔥${formatAttention(attention)}` : undefined;
  const matchTitle = `${homeDisplayName} vs ${awayDisplayName}`;

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
      aria-label={t("openTradePageFor", { name: matchTitle })}
      onClick={navigateToTrade}
      onKeyDown={handleCardKeyDown}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 text-[12px] font-[400] leading-[15px] text-[#909090]">
          {kickoffLabel}
        </p>
        <MatchBookmarkControl
          matchId={match.id}
          homeTeamName={homeDisplayName}
          awayTeamName={awayDisplayName}
        />
      </div>

      <div className="mt-2 flex min-w-0 items-center gap-2">
        <div className="flex shrink-0 items-center gap-[4px]">
          <TeamFlag
            code={homeTeam.code}
            name={homeDisplayName}
            className="relative z-[1] h-[26px] w-[26px] rounded-[4px] text-[26px]"
          />
          <TeamFlag
            code={awayTeam.code}
            name={awayDisplayName}
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
            price={outcomePrices?.[outcomeSide]}
            background={MATCH_OUTCOME_BUTTON_BACKGROUNDS[outcomeSide]}
            matchLabel={matchTitle}
          />
        ))}
      </div>
    </article>
  );
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
  const t = useTranslations("tracks");

  return (
    <div
      className={cn(
        "mt-6 grid flex-1 items-start gap-2",
        attention !== undefined ? "grid-cols-3" : "grid-cols-2"
      )}
    >
      <StatColumn label={t("net")} value={probability} />
      <StatColumn label={t("volume")} value={volume} />
      {attention !== undefined ? (
        <StatColumn label={t("attention")} value={attention} align="center" />
      ) : null}
    </div>
  );
}

function TopAttentionBadge({ label }: { label: string }) {
  const localizedLabel = useLocalizedTopAttentionBadge(label);
  const style = resolveTopAttentionBadgeStyle(label);

  return (
    <span
      className="shrink-0 rounded-[10px] px-2 py-0.5 text-[12px] font-[400] leading-[15px]"
      style={{
        color: style.color,
        backgroundColor: style.backgroundColor
      }}
    >
      {localizedLabel}
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
  price,
  background,
  matchLabel
}: {
  matchId: string;
  outcomeSide: MatchOutcomeSide;
  price?: number;
  background: string;
  matchLabel: string;
}) {
  const t = useTranslations("tracks");
  const router = useRouter();
  const auth = useAuthOptional();
  const setMatchOutcomeSide = useSetTradeMatchOutcomeSide();
  const isBuyRestricted = auth?.isBuyRestricted ?? false;
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const regionRestricted = isAuthenticated && isBuyRestricted;
  const outcomeLabel = useMatchOutcomeLabel(outcomeSide);
  const priceLabel =
    price !== undefined ? formatOrderbookPrice(price) : undefined;
  const buttonLabel = priceLabel ? `${outcomeLabel} ${priceLabel}` : outcomeLabel;

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
      aria-label={t("matchOutcomeAtPrice", {
        outcome: outcomeLabel,
        match: matchLabel,
        price: buttonLabel
      })}
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
  const t = useTranslations("tracks");
  const router = useRouter();
  const auth = useAuthOptional();
  const syncTeamSnapshot = useSyncTradeTicketSnapshot();
  const setOutcomeSide = useSetTradeOutcomeSide();
  const isBuyRestricted = auth?.isBuyRestricted ?? false;
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const regionRestricted = isAuthenticated && isBuyRestricted;
  const isYes = side === "yes";
  const displayName = useLocalizedTeamName(
    snapshot.team.code,
    snapshot.team.name
  );
  const price = getTeamSimpleSidePrice(snapshot, side);
  const priceLabel = formatOrderbookPrice(price);
  const sideLabel = isYes ? t("yesOutcome").toUpperCase() : t("noOutcome").toUpperCase();
  const buttonLabel = `${sideLabel} ${priceLabel}`;

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
      aria-label={t("outcomeAtPrice", {
        side: isYes ? t("yesOutcome") : t("noOutcome"),
        team: displayName,
        price: priceLabel
      })}
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
