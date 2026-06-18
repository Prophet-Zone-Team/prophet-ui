"use client";

import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { cn } from "@/lib/cn";
import {
  formatDateFromIso,
  formatTimeFromIso
} from "@/lib/formatters/datetime";
import { formatMatchScore } from "@/lib/market/match-display";
import { resolveWorldCupTeamByGroupItemTitle } from "@/lib/market/resolve-winner-team";
import { isEndedMatchStatus } from "@/lib/market/schedule-match";
import type { WorldCupMatch, WorldCupMatchStatus } from "@/types/market";

const GROUP_MATCH_TIMEZONE = "Asia/Shanghai";

export interface GroupMatchesTableProps {
  matches: WorldCupMatch[];
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
}

function LoadingBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[#ebebeb]/80",
        className ?? "h-4 w-full"
      )}
      aria-hidden
    />
  );
}

function GroupMatchesTableLoading() {
  return (
    <div className="flex flex-col gap-4 px-4 pb-4" aria-hidden>
      {Array.from({ length: 3 }, (_, index) => (
        <LoadingBlock key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

function formatGroupMatchDateTime(kickoffAt: string | undefined): string {
  if (!kickoffAt) {
    return "TBD";
  }

  const date = formatDateFromIso(kickoffAt, GROUP_MATCH_TIMEZONE);
  const time = formatTimeFromIso(kickoffAt, GROUP_MATCH_TIMEZONE);

  if (!date || !time) {
    return "TBD";
  }

  return `${date} ${time}`;
}

type MatchSideOutcome = "win" | "loss" | undefined;

function resolveSideOutcome(
  status: WorldCupMatchStatus,
  sideScore: number | undefined,
  opponentScore: number | undefined
): MatchSideOutcome {
  if (!isEndedMatchStatus(status)) {
    return undefined;
  }

  if (sideScore === undefined || opponentScore === undefined) {
    return undefined;
  }

  if (sideScore > opponentScore) {
    return "win";
  }

  if (sideScore < opponentScore) {
    return "loss";
  }

  return undefined;
}

function MatchOutcomeLabel({ outcome }: { outcome: MatchSideOutcome }) {
  const tTracks = useTranslations("tracks");

  if (outcome === "win") {
    return (
      <span className="shrink-0 text-[14px] font-[500] leading-5 text-[#65AF14] md:text-[16px]">
        {tTracks("matchOutcomeWin")}
      </span>
    );
  }

  if (outcome === "loss") {
    return (
      <span className="shrink-0 text-[14px] font-[500] leading-5 text-[#FF674B] md:text-[16px]">
        {tTracks("matchOutcomeLoss")}
      </span>
    );
  }

  return null;
}

function MatchTeamSideRow({
  name,
  code,
  logoUrl,
  outcome
}: {
  name: string;
  code?: string;
  logoUrl?: string;
  outcome?: MatchSideOutcome;
}) {
  const displayName = useLocalizedTeamName(code, name);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <TeamFlag
        code={code}
        name={displayName}
        logoUrl={logoUrl}
        className="h-9 w-9 shrink-0 rounded-[6px] text-[36px] drop-shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />
      <span className="truncate text-[16px] font-[500] leading-5 text-black">
        {displayName}
      </span>
      <MatchOutcomeLabel outcome={outcome} />
    </div>
  );
}

function MatchTeamSideStack({
  name,
  code,
  logoUrl,
  outcome
}: {
  name: string;
  code?: string;
  logoUrl?: string;
  outcome?: MatchSideOutcome;
}) {
  const displayName = useLocalizedTeamName(code, name);

  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <TeamFlag
        code={code}
        name={displayName}
        logoUrl={logoUrl}
        className="h-9 w-9 shrink-0 rounded-[6px] text-[36px] drop-shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />
      <div className="flex min-w-0 max-w-full flex-col items-center gap-0.5">
        <span className="max-w-full truncate text-center text-[14px] font-[500] leading-5 text-black">
          {displayName}
        </span>
        <MatchOutcomeLabel outcome={outcome} />
      </div>
    </div>
  );
}

function GroupMatchRowMeta({
  kickoffAt,
  ended
}: {
  kickoffAt: string | undefined;
  ended: boolean;
}) {
  const t = useTranslations("trade");

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <time
        dateTime={kickoffAt}
        className="text-[14px] font-[500] leading-5 text-black sm:text-[16px]"
      >
        {formatGroupMatchDateTime(kickoffAt)}
      </time>
      {ended ? (
        <span className="shrink-0 text-[14px] font-[500] leading-5 text-[#909090] sm:text-[16px]">
          {t("groupMatchStatusEnded")}
        </span>
      ) : null}
    </div>
  );
}

function GroupMatchScore({
  ended,
  homeScore,
  awayScore,
  className
}: {
  ended: boolean;
  homeScore?: number;
  awayScore?: number;
  className?: string;
}) {
  const t = useTranslations("trade");

  return (
    <div
      className={cn(
        "text-center text-[16px] font-[500] leading-5 text-black",
        className
      )}
    >
      {ended ? formatMatchScore(homeScore, awayScore) : t("versusShort")}
    </div>
  );
}

function GroupMatchRow({ match }: { match: WorldCupMatch }) {
  const ended = isEndedMatchStatus(match.status);
  const homeName = match.homeDisplayName ?? "—";
  const awayName = match.awayDisplayName ?? "—";
  const homeTeam = resolveWorldCupTeamByGroupItemTitle(homeName);
  const awayTeam = resolveWorldCupTeamByGroupItemTitle(awayName);
  const homeOutcome = resolveSideOutcome(
    match.status,
    match.homeScore,
    match.awayScore
  );
  const awayOutcome = resolveSideOutcome(
    match.status,
    match.awayScore,
    match.homeScore
  );

  const homeSideProps = {
    name: homeName,
    code: homeTeam?.code ?? match.homeTeamId,
    logoUrl: match.homeLogoUrl ?? homeTeam?.logoUrl
  };
  const awaySideProps = {
    name: awayName,
    code: awayTeam?.code ?? match.awayTeamId,
    logoUrl: match.awayLogoUrl ?? awayTeam?.logoUrl
  };

  return (
    <article className="border-t border-[#EBEBEB] px-4 py-4 first:border-t-0">
      <div className="md:hidden">
        <GroupMatchRowMeta kickoffAt={match.kickoffAt} ended={ended} />

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-x-3">
          <MatchTeamSideStack {...homeSideProps} outcome={homeOutcome} />
          <GroupMatchScore
            ended={ended}
            homeScore={match.homeScore}
            awayScore={match.awayScore}
            className="pt-2.5"
          />
          <MatchTeamSideStack {...awaySideProps} outcome={awayOutcome} />
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-[minmax(0,300px)_minmax(0,1fr)_180px_minmax(0,1fr)] md:items-center md:gap-4">
        <GroupMatchRowMeta kickoffAt={match.kickoffAt} ended={ended} />

        <MatchTeamSideRow {...homeSideProps} outcome={homeOutcome} />

        <GroupMatchScore
          ended={ended}
          homeScore={match.homeScore}
          awayScore={match.awayScore}
        />

        <MatchTeamSideRow {...awaySideProps} outcome={awayOutcome} />
      </div>
    </article>
  );
}

export function GroupMatchesTable({
  matches,
  isLoading = false,
  isError = false,
  className
}: GroupMatchesTableProps) {
  const t = useTranslations("trade");

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[12px] border border-[#EBEBEB] bg-white",
        className
      )}
      aria-label={t("groupMatchesAria")}
    >
      <h2 className="px-4 py-4 text-[18px] font-[500] leading-[23px] text-black">
        {t("scores")}
      </h2>

      {isLoading ? (
        <GroupMatchesTableLoading />
      ) : isError ? (
        <p className="px-4 py-8 text-center text-sm text-prophet-muted">
          {t("groupMatchesUnavailable")}
        </p>
      ) : matches.length > 0 ? (
        <div>
          {matches.map((match) => (
            <GroupMatchRow key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <p className="px-4 py-8 text-center text-sm text-prophet-muted">
          {t("noGroupMatches")}
        </p>
      )}
    </section>
  );
}
