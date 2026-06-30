"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { MatchStatusBadge } from "@/components/match/match-status-badge";
import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import { formatMatchScore, formatSportsMatchPeriod } from "@/lib/market/match-display";
import { isEffectiveLiveMatch } from "@/lib/market/live-match";
import {
  isMockLiveFixtureEnabled,
  MOCK_LIVE_FIXTURE_ELAPSED_SECONDS
} from "@/lib/market/mock-live-fixture-config";
import {
  formatScheduleKickoff,
  getScheduleRowVariant,
  resolveMatchSides
} from "@/lib/market/schedule-match";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { useGameStatistics } from "@/hooks/market/use-game-statistics";
import { useMatchWithLiveState } from "@/store/match-live-store";
import { teamDetailHref } from "@/lib/routes/team";
import { LiveMatchElapsedClock } from "@/views/trade/game/header/live-match-elapsed-clock";
import type {
  ApiFootballTeamProfile,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";

const flagClassName =
  "h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cover bg-center sm:h-[85px] sm:w-[85px]";

export type TradeGameHeaderProps = {
  match: WorldCupMatch;
  snapshots: TeamMarketSnapshot[];
  teamProfiles?: Partial<Record<string, ApiFootballTeamProfile>>;
};

type TeamSideData = {
  teamId?: string;
  name: string;
  code?: string;
  logoUrl?: string;
};

function ForwardChevronIcon() {
  return (
    <svg
      width="5"
      height="11"
      viewBox="0 0 5 11"
      fill="none"
      className="mt-1 shrink-0"
      aria-hidden
    >
      <path
        d="M0.5 0.5L4.5 5.5L0.5 10.5"
        stroke="#909090"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TeamSide({
  teamId,
  name,
  code,
  logoUrl,
  align = "center"
}: TeamSideData & { align?: "center" | "start" | "end" }) {
  const content = (
    <div
      className={cn(
        "flex w-[108px] flex-col md:w-[170px]",
        align === "end" && "items-end",
        align === "start" && "items-start",
        align === "center" && "items-center"
      )}
    >
      <TeamFlag
        code={code}
        name={name}
        logoUrl={logoUrl}
        className={cn(
          flagClassName,
          "!h-16 !w-16 !rounded-xl text-[52px] sm:!h-[85px] sm:!w-[85px] sm:text-[72px]"
        )}
      />

      <span className="mt-3 inline-flex max-w-full items-center gap-[8px] sm:mt-[21px] sm:gap-1.5">
        <span className="truncate text-lg font-[400] capitalize leading-6 text-white sm:text-[26px] sm:leading-[31px]">
          {name}
        </span>
        {teamId ? <ForwardChevronIcon /> : null}
      </span>
    </div>
  );

  if (!teamId) {
    return content;
  }

  return (
    <Link
      href={teamDetailHref(teamId)}
      className="min-w-0 transition-opacity hover:opacity-80"
    >
      {content}
    </Link>
  );
}

function HeaderMetric({
  value,
  statusVariant,
  subtitle,
  badgeLabel,
  badgeTrailing,
  statusAriaLabel,
  versusLabel
}: {
  value: string;
  statusVariant?: ReturnType<typeof getScheduleRowVariant>;
  subtitle?: React.ReactNode;
  badgeLabel?: string;
  badgeTrailing?: React.ReactNode;
  statusAriaLabel?: string;
  versusLabel: string;
}) {
  return (
    <div className="relative h-full w-full overflow-visible md:w-[453px]">
      <div className="flex flex-col justify-center items-center h-full relative z-10 mt-[24px] md:mt-[35px]">
        {statusVariant === "upcoming" ? (
          <span className="text-[#909090] text-[36px] font-[500]">
            {versusLabel}
          </span>
        ) : (
          <strong className="text-center text-[40px] font-[400] capitalize leading-[48px] text-white sm:text-[60px] sm:leading-[72px]">
            {value}
          </strong>
        )}

        {statusVariant ? (
          <div className="mt-4 flex flex-col items-center gap-1 sm:mt-7">
            <div className="inline-flex items-center gap-[7px]">
              <MatchStatusBadge
                variant={statusVariant}
                className="gap-[7px]"
                label={badgeLabel}
                ariaLabel={badgeTrailing ? statusAriaLabel : undefined}
              />
              {badgeTrailing}
            </div>
          </div>
        ) : null}

        {subtitle ? (
          typeof subtitle === "string" ? (
            <span
              className={cn(
                "text-xs font-[500] leading-[17px] text-[#909090] sm:text-sm whitespace-nowrap",
                statusVariant ? "mt-5 sm:mt-[33px]" : "mt-4 sm:mt-7"
              )}
            >
              {subtitle}
            </span>
          ) : (
            subtitle
          )
        ) : null}
      </div>
    </div>
  );
}

function TeamSideColumn({
  team,
  justify
}: {
  team?: TeamSideData;
  justify: "start" | "end";
}) {
  return (
    <div
      className={cn(
        "relative z-10 flex pt-10 sm:pt-[64px]",
        justify === "end" ? "justify-end" : "justify-start"
      )}
    >
      {team ? <TeamSide {...team} align="center" /> : null}
    </div>
  );
}

export function TradeGameHeader({
  match,
  snapshots,
  teamProfiles
}: TradeGameHeaderProps) {
  const tHome = useTranslations("home");
  const liveMatch = useMatchWithLiveState(match);
  const sides = resolveMatchSides(liveMatch, snapshots);
  const homeDisplayName = useLocalizedTeamName(sides.home.code, sides.home.name);
  const awayDisplayName = useLocalizedTeamName(sides.away.code, sides.away.name);
  const { stoppageExtraMinutes } = useGameStatistics({
    match,
    homeTeamName: homeDisplayName,
    awayTeamName: awayDisplayName
  });

  const homeProfile = liveMatch.homeTeamId
    ? teamProfiles?.[liveMatch.homeTeamId]
    : undefined;
  const awayProfile = liveMatch.awayTeamId
    ? teamProfiles?.[liveMatch.awayTeamId]
    : undefined;
  const mockLiveFixture = isMockLiveFixtureEnabled();
  const effectiveLive = isEffectiveLiveMatch(liveMatch) || mockLiveFixture;
  const resolvedElapsedSeconds = mockLiveFixture
    ? MOCK_LIVE_FIXTURE_ELAPSED_SECONDS
    : liveMatch.liveElapsedSeconds;
  const showPeriodInsteadOfClock =
    !mockLiveFixture && Boolean(liveMatch.liveElapsedUnavailable);
  const periodLabel = formatSportsMatchPeriod(liveMatch.period);
  const displayScore = {
    homeScore: liveMatch.homeScore,
    awayScore: liveMatch.awayScore
  };
  const statusVariant = effectiveLive
    ? "ongoing"
    : getScheduleRowVariant(liveMatch.status);
  const statusLabel =
    statusVariant === "ongoing"
      ? tHome("matchStatusOngoing")
      : statusVariant === "upcoming"
        ? tHome("matchStatusUpcoming")
        : tHome("matchStatusEnded");
  const badgeLabel = effectiveLive ? "" : statusLabel;
  const badgeTrailing = effectiveLive ? (
    <span className="inline-flex items-baseline whitespace-nowrap">
      {showPeriodInsteadOfClock ? (
        periodLabel ? (
          <span className="text-sm font-[400] leading-[18px] text-[#7BCA25]">
            {periodLabel}
          </span>
        ) : null
      ) : (
        <>
          <LiveMatchElapsedClock
            baseElapsedSeconds={resolvedElapsedSeconds}
            kickoffAt={liveMatch.kickoffAt}
            isLive={effectiveLive}
            className="text-sm font-[400] leading-[18px] text-[#7BCA25]"
          />
          {stoppageExtraMinutes !== undefined ? (
            <span className="text-sm font-[556] leading-[17px] text-[#909090]">
              +{stoppageExtraMinutes}
            </span>
          ) : null}
        </>
      )}
    </span>
  ) : undefined;
  const subtitle = effectiveLive
    ? undefined
    : formatScheduleKickoff(liveMatch.kickoffAt);

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] w-full relative h-full gap-x-5">
      <TeamSideColumn
        team={{
          teamId: match.homeTeamId,
          name: homeDisplayName,
          code: sides.home.code,
          logoUrl: sides.home.logoUrl ?? homeProfile?.logoUrl
        }}
        justify="end"
      />
      <HeaderMetric
        value={formatMatchScore(displayScore.homeScore, displayScore.awayScore)}
        statusVariant={statusVariant}
        subtitle={subtitle}
        badgeLabel={badgeLabel}
        badgeTrailing={badgeTrailing}
        statusAriaLabel={statusLabel}
        versusLabel={tHome("versus")}
      />
      <TeamSideColumn
        team={{
          teamId: match.awayTeamId,
          name: awayDisplayName,
          code: sides.away.code,
          logoUrl: sides.away.logoUrl ?? awayProfile?.logoUrl
        }}
        justify="start"
      />
    </div>
  );
}
