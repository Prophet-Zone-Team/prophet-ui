"use client";

import Link from "next/link";

import { MatchStatusBadge } from "@/components/match/match-status-badge";
import { TeamFlag } from "@/components/teams/team-flag";
import { formatVolume } from "@/components/home/market-formatters";
import { cn } from "@/lib/cn";
import { formatMatchScore } from "@/lib/market/match-display";
import {
  getOutcomePillLabel,
  getOutcomePillStyles,
  getTeamMatchOutcome,
  resolveMatchResultWinner,
  type TeamMatchOutcome
} from "@/lib/market/match-result";
import {
  formatOutcomePercent,
  parseMatchOutcomeOdds
} from "@/lib/market/match-outcome-odds";
import {
  formatScheduleKickoff,
  getMatchVolume,
  getScheduleRowVariant,
  resolveMatchSides,
  type ScheduleRowVariant
} from "@/lib/market/schedule-match";
import { gameTradeHref } from "@/lib/routes/trade";
import type { TeamMarketSnapshot, WorldCupMatch } from "@/types/market";
import { MatchBookmarkControl } from "@/views/home/matches/match-bookmark-control";
import { MatchProbabilityBar } from "@/views/home/matches/match-probability-bar";
import { MatchResultBar } from "@/views/home/matches/match-result-bar";
import { useRouter } from "next/navigation";

export interface ScheduleMatchRowProps {
  match: WorldCupMatch;
  snapshots: TeamMarketSnapshot[];
  className?: string;
}

export function ScheduleMatchRow({
  match,
  snapshots,
  className
}: ScheduleMatchRowProps) {
  const router = useRouter();
  const variant = getScheduleRowVariant(match.status);
  const sides = resolveMatchSides(match, snapshots);
  const oddsResult = parseMatchOutcomeOdds(
    match,
    sides.home.name,
    sides.away.name
  );
  const homePct =
    oddsResult.status === "ready"
      ? formatOutcomePercent(oddsResult.probabilities.home)
      : "—";
  const awayPct =
    oddsResult.status === "ready"
      ? formatOutcomePercent(oddsResult.probabilities.away)
      : "—";
  const volume = getMatchVolume(match, snapshots);
  const volumeLabel = volume > 0 ? `$${formatVolume(volume)}` : "—";
  const kickoffLabel = formatScheduleKickoff(match.kickoffAt);
  const scoreLabel = formatMatchScore(match.homeScore, match.awayScore);
  const resultWinner = resolveMatchResultWinner(
    match.homeScore,
    match.awayScore
  );

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-[#EBEBEB] bg-white px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4",
        variant === "ended" && "opacity-90",
        className
      )}
      aria-label={`${sides.home.name} vs ${sides.away.name}, ${variant}`}
      onClick={() => {
        router.push(gameTradeHref(match.id));
      }}
    >
      <div className="flex shrink-0 items-center gap-3">
        <MatchBookmarkControl matchId={match.id} />
        <StatusColumn variant={variant} kickoffLabel={kickoffLabel} />
      </div>

      <div className="flex min-w-0 flex-1 justify-center">
        <div className="w-full max-w-[558px]">
          {variant === "upcoming" ? (
            <UpcomingMatchBody
              sides={sides}
              homePct={homePct}
              awayPct={awayPct}
            />
          ) : variant === "ended" ? (
            <EndedMatchBody
              sides={sides}
              scoreLabel={scoreLabel}
              resultWinner={resultWinner}
            />
          ) : (
            <OngoingMatchBody
              sides={sides}
              homePct={homePct}
              awayPct={awayPct}
              scoreLabel={scoreLabel}
              probabilities={
                oddsResult.status === "ready"
                  ? oddsResult.probabilities
                  : undefined
              }
            />
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
        <VolumeColumn amount={volumeLabel} />
      </div>
    </article>
  );
}

function StatusColumn({
  variant,
  kickoffLabel
}: {
  variant: ScheduleRowVariant;
  kickoffLabel: string;
}) {
  return (
    <div className="w-[72px] shrink-0 sm:w-[80px]">
      <MatchStatusBadge variant={variant} className="font-semibold" />
      <p className="m-0 mt-0.5 text-xs leading-[14px] text-[#909090]">
        {kickoffLabel}
      </p>
    </div>
  );
}

function UpcomingMatchBody({
  sides,
  homePct,
  awayPct
}: {
  sides: ReturnType<typeof resolveMatchSides>;
  homePct: string;
  awayPct: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
      <TeamPercentSide
        align="start"
        percent={homePct}
        name={sides.home.name}
        code={sides.home.code}
        percentFirst
      />
      <span className="px-1 text-sm font-normal text-[#909090]">VS</span>
      <TeamPercentSide
        align="end"
        percent={awayPct}
        name={sides.away.name}
        code={sides.away.code}
        percentFirst={false}
      />
    </div>
  );
}

function OngoingMatchBody({
  sides,
  homePct,
  awayPct,
  scoreLabel,
  probabilities
}: {
  sides: ReturnType<typeof resolveMatchSides>;
  homePct: string;
  awayPct: string;
  scoreLabel: string;
  probabilities?: { home: number; draw: number; away: number };
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <TeamPercentSide
          align="start"
          percent={homePct}
          name={sides.home.name}
          code={sides.home.code}
          percentFirst
        />
        <strong className="px-1 text-lg font-[556] leading-[21px] text-black">
          {scoreLabel}
        </strong>
        <TeamPercentSide
          align="end"
          percent={awayPct}
          name={sides.away.name}
          code={sides.away.code}
          percentFirst={false}
        />
      </div>
      {probabilities ? (
        <MatchProbabilityBar probabilities={probabilities} variant="compact" />
      ) : null}
    </div>
  );
}

function EndedMatchBody({
  sides,
  scoreLabel,
  resultWinner
}: {
  sides: ReturnType<typeof resolveMatchSides>;
  scoreLabel: string;
  resultWinner: ReturnType<typeof resolveMatchResultWinner>;
}) {
  const homeOutcome =
    resultWinner !== undefined
      ? getTeamMatchOutcome("home", resultWinner)
      : undefined;
  const awayOutcome =
    resultWinner !== undefined
      ? getTeamMatchOutcome("away", resultWinner)
      : undefined;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <TeamResultSide
          align="start"
          outcome={homeOutcome}
          name={sides.home.name}
          code={sides.home.code}
          outcomeFirst
        />
        <strong className="px-1 text-lg font-[556] leading-[21px] text-black">
          {scoreLabel}
        </strong>
        <TeamResultSide
          align="end"
          outcome={awayOutcome}
          name={sides.away.name}
          code={sides.away.code}
          outcomeFirst={false}
        />
      </div>
      <MatchResultBar winner={resultWinner} />
    </div>
  );
}

function TeamPercentSide({
  align,
  percent,
  name,
  code,
  percentFirst
}: {
  align: "start" | "end";
  percent: string;
  name: string;
  code?: string;
  percentFirst: boolean;
}) {
  const flag = (
    <TeamFlag
      code={code}
      name={name}
      className="h-6 w-6 shrink-0 rounded-[2px] text-[24px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
    />
  );
  const pct = (
    <span className="text-base font-[556] leading-[19px] text-black">
      {percent}
    </span>
  );
  const label = (
    <span className="truncate text-base font-[556] leading-[19px] text-black">
      {name}
    </span>
  );

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3",
        align === "end" && "flex-row-reverse justify-start text-right"
      )}
    >
      {percentFirst ? (
        <>
          {pct}
          {flag}
          {label}
        </>
      ) : (
        <>
          {label}
          {flag}
          {pct}
        </>
      )}
    </div>
  );
}

function TeamResultSide({
  align,
  outcome,
  name,
  code,
  outcomeFirst
}: {
  align: "start" | "end";
  outcome?: TeamMatchOutcome;
  name: string;
  code?: string;
  outcomeFirst: boolean;
}) {
  const flag = (
    <TeamFlag
      code={code}
      name={name}
      className="h-6 w-6 shrink-0 rounded-[2px] text-[24px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
    />
  );
  const pill = outcome ? <OutcomePill outcome={outcome} /> : null;
  const label = (
    <span className="truncate text-base font-[556] leading-[19px] text-black">
      {name}
    </span>
  );

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 sm:gap-3",
        align === "end" && "flex-row-reverse justify-start text-right"
      )}
    >
      {outcomeFirst ? (
        <>
          {pill}
          {flag}
          {label}
        </>
      ) : (
        <>
          {label}
          {flag}
          {pill}
        </>
      )}
    </div>
  );
}

function OutcomePill({ outcome }: { outcome: TeamMatchOutcome }) {
  const styles = getOutcomePillStyles(outcome);

  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold leading-[14px]"
      style={{ background: styles.background, color: styles.color }}
    >
      {getOutcomePillLabel(outcome)}
    </span>
  );
}

function VolumeColumn({ amount }: { amount: string }) {
  return (
    <div className="flex w-full shrink-0 flex-col items-end sm:w-[88px]">
      <strong className="text-lg font-[556] leading-[21px] text-black">
        {amount}
      </strong>
      <span className="text-xs font-normal leading-[14px] text-[#909090]">
        Volume
      </span>
    </div>
  );
}
