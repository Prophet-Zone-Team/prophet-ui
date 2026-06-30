"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { MatchStatusBadge } from "@/components/match/match-status-badge";
import { TeamFlag } from "@/components/teams/team-flag";
import { gameTradeHref } from "@/lib/routes/trade";
import { cn } from "@/lib/cn";
import { buildGameMarketSnapshot } from "@/lib/market/game-market-snapshot";
import { formatMatchScore } from "@/lib/market/match-display";
import {
  formatScheduleKickoff,
  getScheduleRowVariant,
  resolveMatchSides
} from "@/lib/market/schedule-match";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { useMatchWithLiveState } from "@/store/match-live-store";
import type { TeamMarketSnapshot, WorldCupMatch } from "@/types/market";
import { getGameSidePrice } from "@/views/trade/game/market-section/format-bid-label";
import { gameColors } from "@/views/trade/game/ui";
import { GameOutcomeBidButton } from "@/views/trade/shared/game-outcome-bid-buttons";

function MatchSide({
  name,
  code,
  emphasized
}: {
  name: string;
  code?: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <TeamFlag
        code={code}
        name={name}
        className="h-[33px] w-[33px] rounded-[6px] text-[33px]"
      />
      <span
        className={cn(
          "max-w-full truncate text-center text-[16px] font-[500]",
          emphasized ? "text-prophet-foreground" : "text-prophet-muted"
        )}
      >
        {name}
      </span>
    </div>
  );
}

export interface RelatedGameCardProps {
  match: WorldCupMatch;
  snapshots: TeamMarketSnapshot[];
  highlightTeamId: string;
}

export function RelatedGameCard({
  match,
  snapshots,
  highlightTeamId
}: RelatedGameCardProps) {
  const t = useTranslations("trade");
  const tHome = useTranslations("home");
  const liveMatch = useMatchWithLiveState(match);
  const sides = resolveMatchSides(liveMatch, snapshots);
  const homeDisplayName = useLocalizedTeamName(sides.home.code, sides.home.name);
  const awayDisplayName = useLocalizedTeamName(sides.away.code, sides.away.name);
  const gameSnapshot = buildGameMarketSnapshot(liveMatch, snapshots);
  const homePrice = getGameSidePrice(gameSnapshot, "home");
  const drawPrice = getGameSidePrice(gameSnapshot, "draw");
  const awayPrice = getGameSidePrice(gameSnapshot, "away");
  const homeBidLabel =
    sides.home.code ?? sides.home.name.slice(0, 3).toUpperCase();
  const awayBidLabel =
    sides.away.code ?? sides.away.name.slice(0, 3).toUpperCase();
  const scoreLabel = formatMatchScore(liveMatch.homeScore, liveMatch.awayScore);
  const kickoffLabel = formatScheduleKickoff(liveMatch.kickoffAt);
  const statusVariant = getScheduleRowVariant(liveMatch.status);
  const statusLabel =
    statusVariant === "ongoing"
      ? tHome("matchStatusOngoing")
      : statusVariant === "upcoming"
        ? tHome("matchStatusUpcoming")
        : tHome("matchStatusEnded");

  return (
    <div className="w-full md:max-w-[313px] rounded-xl bg-prophet-panel px-4 py-3 shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0_0_14px_rgba(0,0,0,0.14)]">
      <Link href={gameTradeHref(match.id)} className="block">
        <div className="flex items-center justify-between">
          <MatchStatusBadge
            variant={statusVariant}
            size="sm"
            label={statusLabel}
          />
          <span className="text-[14px] font-[500] leading-[17px] text-prophet-muted">
            {kickoffLabel}
          </span>
        </div>

        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <MatchSide
            name={homeDisplayName}
            code={sides.home.code}
            emphasized={match.homeTeamId === highlightTeamId}
          />
          <strong
            className={cn(
              "text-center font-[500] leading-[31px] pb-[24px]",
              statusVariant === "upcoming"
                ? "text-prophet-muted text-[16px]"
                : "text-prophet-foreground text-[26px]"
            )}
          >
            {statusVariant === "upcoming" ? t("versusShort") : scoreLabel}
          </strong>
          <MatchSide
            name={awayDisplayName}
            code={sides.away.code}
            emphasized={match.awayTeamId === highlightTeamId}
          />
        </div>
      </Link>

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <GameOutcomeBidButton
          size="sm"
          title={homeBidLabel}
          price={homePrice}
          background={gameColors.home}
        />
        <GameOutcomeBidButton
          size="sm"
          title={t("draw")}
          price={drawPrice}
          background={gameColors.draw}
        />
        <GameOutcomeBidButton
          size="sm"
          title={awayBidLabel}
          price={awayPrice}
          background={gameColors.awayBar}
        />
      </div>
    </div>
  );
}
