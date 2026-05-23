"use client";

import Link from "next/link";

import { MatchStatusBadge } from "@/components/match/match-status-badge";
import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import {
  formatMatchScore,
  formatTeamWinLossRecord
} from "@/lib/market/match-display";
import {
  formatScheduleKickoff,
  getScheduleRowVariant,
  resolveMatchSides,
  type ScheduleRowVariant
} from "@/lib/market/schedule-match";
import { teamDetailHref } from "@/lib/routes/team";
import Bg from "@/views/trade/simple/header/bg";
import type {
  ApiFootballStandingContext,
  ApiFootballTeamProfile,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";

const HEADER_HEIGHT = 258;
const flagClassName =
  "h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cover bg-center shadow-[0_0_2px_rgba(0,0,0,0.2)] sm:h-[85px] sm:w-[85px]";

export type TradeSimpleHeaderGameProps = {
  variant: "game";
  match: WorldCupMatch;
  snapshots: TeamMarketSnapshot[];
  teamProfiles?: Partial<Record<string, ApiFootballTeamProfile>>;
};

export type TradeSimpleHeaderTeamProps = {
  variant: "team";
  snapshot: TeamMarketSnapshot;
  profile?: ApiFootballTeamProfile;
  standings?: ApiFootballStandingContext[];
};

export type TradeSimpleHeaderProps =
  | TradeSimpleHeaderGameProps
  | TradeSimpleHeaderTeamProps;

type TeamSideData = {
  teamId?: string;
  name: string;
  code?: string;
  logoUrl?: string;
};

type HeaderMetricData = {
  value: string;
  statusVariant?: ScheduleRowVariant;
  subtitle?: string;
};

type HeaderViewModel = {
  layout: "game" | "team";
  metric: HeaderMetricData;
  teams: {
    focal?: TeamSideData;
    home?: TeamSideData;
    away?: TeamSideData;
  };
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
        "flex w-[108px] flex-col sm:w-[170px]",
        align === "end" && "items-end",
        align === "start" && "items-start",
        align === "center" && "items-center"
      )}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className={cn(flagClassName, "object-cover")}
        />
      ) : (
        <TeamFlag
          code={code}
          name={name}
          className={cn(
            flagClassName,
            "!h-16 !w-16 !rounded-xl text-[52px] sm:!h-[85px] sm:!w-[85px] sm:text-[72px]"
          )}
        />
      )}

      <span className="mt-3 inline-flex max-w-full items-center gap-1 sm:mt-[21px] sm:gap-1.5">
        <span className="truncate text-lg font-[556] capitalize leading-6 text-white sm:text-[26px] sm:leading-[31px]">
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
  className
}: HeaderMetricData & { className?: string }) {
  return (
    <div className="relative w-[453px] h-full">
      <div className="absolute top-[10px] h-full">
        <Bg />
      </div>
      <div
        className={cn(
          "flex flex-col justify-center items-center h-full relative z-10 mt-[80px]"
        )}
      >
        <strong className="text-center text-[40px] font-[556] capitalize leading-[48px] text-white sm:text-[60px] sm:leading-[72px]">
          {value}
        </strong>

        {statusVariant ? (
          <div className="mt-4 sm:mt-7">
            <MatchStatusBadge variant={statusVariant} className="gap-[7px]" />
          </div>
        ) : null}

        {subtitle ? (
          <span
            className={cn(
              "text-xs font-[556] leading-[17px] text-[#909090] sm:text-sm",
              statusVariant ? "mt-5 sm:mt-[33px]" : "mt-4 sm:mt-7"
            )}
          >
            {subtitle}
          </span>
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
        "flex pt-10 sm:pt-[64px]",
        justify === "end" ? "justify-end" : "justify-start"
      )}
    >
      {team ? <TeamSide {...team} align="center" /> : null}
    </div>
  );
}

function getTeamRecordSubtitle(
  standings?: ApiFootballStandingContext[]
): string | undefined {
  const standing = standings?.[0];

  if (!standing) {
    return undefined;
  }

  if (standing.group) {
    return `Group ${standing.group}`;
  }

  if (standing.played !== undefined) {
    return `${standing.played} played`;
  }

  return undefined;
}

function resolveHeaderViewModel(
  props: TradeSimpleHeaderProps
): HeaderViewModel {
  if (props.variant === "game") {
    const sides = resolveMatchSides(props.match, props.snapshots);
    const homeProfile = props.match.homeTeamId
      ? props.teamProfiles?.[props.match.homeTeamId]
      : undefined;
    const awayProfile = props.match.awayTeamId
      ? props.teamProfiles?.[props.match.awayTeamId]
      : undefined;

    return {
      layout: "game",
      metric: {
        value: formatMatchScore(props.match.homeScore, props.match.awayScore),
        statusVariant: getScheduleRowVariant(props.match.status),
        subtitle: formatScheduleKickoff(props.match.kickoffAt)
      },
      teams: {
        home: {
          teamId: props.match.homeTeamId,
          name: sides.home.name,
          code: sides.home.code,
          logoUrl: homeProfile?.logoUrl
        },
        away: {
          teamId: props.match.awayTeamId,
          name: sides.away.name,
          code: sides.away.code,
          logoUrl: awayProfile?.logoUrl
        }
      }
    };
  }

  const standing = props.standings?.[0];
  const { team } = props.snapshot;

  return {
    layout: "team",
    metric: {
      value: formatTeamWinLossRecord(standing?.wins, standing?.losses),
      subtitle: getTeamRecordSubtitle(props.standings)
    },
    teams: {
      focal: {
        teamId: team.id,
        name: team.name,
        code: team.code,
        logoUrl: props.profile?.logoUrl
      }
    }
  };
}

export function TradeSimpleHeader(props: TradeSimpleHeaderProps) {
  const { layout, metric, teams } = resolveHeaderViewModel(props);

  return layout === "game" ? (
    <div className="relative h-full flex w-full justify-center">
      <TeamSideColumn team={teams.home} justify="end" />
      <HeaderMetric {...metric} />
      <TeamSideColumn team={teams.away} justify="start" />
    </div>
  ) : (
    <div className="relative h-full flex w-full justify-center">
      <div className="mt-[60px]">
        {teams.focal ? <TeamSide {...teams.focal} align="center" /> : null}
      </div>
      <HeaderMetric {...metric} />
    </div>
  );
}
