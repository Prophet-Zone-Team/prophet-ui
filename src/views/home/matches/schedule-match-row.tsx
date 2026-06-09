"use client";

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
import { useMatchWithLiveState } from "@/store/match-live-store";
import type { TeamMarketSnapshot, WorldCupMatch } from "@/types/market";
import { MatchBookmarkControl } from "@/views/home/matches/match-bookmark-control";
import { MatchResultBar } from "@/views/home/matches/match-result-bar";
import { ScheduleMatchOutcomeBar } from "@/views/home/matches/schedule-match-outcome-bar";
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
  const liveMatch = useMatchWithLiveState(match);
  const variant = getScheduleRowVariant(liveMatch.status);
  const sides = resolveMatchSides(match, snapshots);
  const oddsResult = parseMatchOutcomeOdds(
    liveMatch,
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
  const volume = getMatchVolume(liveMatch, snapshots);
  const volumeLabel = volume > 0 ? `$${formatVolume(volume)}` : "—";
  const kickoffLabel = formatScheduleKickoff(liveMatch.kickoffAt);
  const scoreLabel = formatMatchScore(liveMatch.homeScore, liveMatch.awayScore);
  const resultWinner = resolveMatchResultWinner(
    liveMatch.homeScore,
    liveMatch.awayScore
  );
  const canNavigate = variant !== "ended";

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-[#EBEBEB] bg-white px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4",
        canNavigate
          ? "cursor-pointer transition-colors hover:border-[#d0d0d0] hover:bg-[#fafbfc]"
          : "cursor-default",
        variant === "ended" && "opacity-90",
        variant === "ongoing" &&
          "border-[#7BCA25] shadow-[0_0_10px_rgba(123,202,37,0.25)]",
        className
      )}
      aria-label={`${sides.home.name} vs ${sides.away.name}, ${variant}`}
      onClick={
        canNavigate
          ? () => {
              router.push(gameTradeHref(match.id));
            }
          : undefined
      }
    >
      <div className="flex shrink-0 justify-between items-center gap-1 md:w-[20%]">
        <div className="flex shrink-0 items-center gap-3">
          <MatchBookmarkControl
            matchId={match.id}
            homeTeamName={sides.home.name}
            awayTeamName={sides.away.name}
          />
          <StatusColumn variant={variant} kickoffLabel={kickoffLabel} />
        </div>
        <div className="block md:hidden">
          <VolumeColumn amount={volumeLabel} />
        </div>
      </div>

      <div className="flex justify-center md:w-[60%]">
        <div className="w-full max-w-[558px]">
          {variant === "upcoming" ? (
            <UpcomingMatchBody
              sides={sides}
              homePct={homePct}
              awayPct={awayPct}
              probabilities={
                oddsResult.status === "ready"
                  ? oddsResult.probabilities
                  : undefined
              }
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

      <div className="hidden sm:w-[20%] md:flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-end md:justify-end">
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
    <div className="shrink-0">
      <MatchStatusBadge variant={variant} className="font-semibold" />
      <p className="m-0 mt-[4px] text-xs md:text-[14px] leading-[14px] text-[#909090]">
        {kickoffLabel}
      </p>
    </div>
  );
}

function UpcomingMatchBody({
  sides,
  homePct,
  awayPct,
  probabilities
}: {
  sides: ReturnType<typeof resolveMatchSides>;
  homePct: string;
  awayPct: string;
  probabilities?: { home: number; draw: number; away: number };
}) {
  return (
    <div className="pt-[14px] pb-[10px]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <TeamPercentSide
          align="start"
          percent={homePct}
          name={sides.home.name}
          code={sides.home.code}
          logoUrl={sides.home.logoUrl}
        />
        <span className="px-1 text-sm font-normal text-[#909090]">VS</span>
        <TeamPercentSide
          align="end"
          percent={awayPct}
          name={sides.away.name}
          code={sides.away.code}
          logoUrl={sides.away.logoUrl}
        />
      </div>
      {probabilities ? (
        <ScheduleMatchOutcomeBar probabilities={probabilities} />
      ) : null}
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
    <div className="pt-[14px] pb-[10px]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <TeamPercentSide
          align="start"
          percent={homePct}
          name={sides.home.name}
          code={sides.home.code}
          logoUrl={sides.home.logoUrl}
        />
        <strong className="px-1 text-lg font-[500] leading-[21px] text-black">
          {scoreLabel}
        </strong>
        <TeamPercentSide
          align="end"
          percent={awayPct}
          name={sides.away.name}
          code={sides.away.code}
          logoUrl={sides.away.logoUrl}
        />
      </div>
      {probabilities ? (
        <ScheduleMatchOutcomeBar probabilities={probabilities} />
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
    <div className="pt-[14px] pb-[10px]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <TeamResultSide
          align="start"
          outcome={homeOutcome}
          name={sides.home.name}
          code={sides.home.code}
          logoUrl={sides.home.logoUrl}
        />
        <strong className="px-1 text-lg font-[500] leading-[21px] text-black">
          {scoreLabel}
        </strong>
        <TeamResultSide
          align="end"
          outcome={awayOutcome}
          name={sides.away.name}
          code={sides.away.code}
          logoUrl={sides.away.logoUrl}
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
  logoUrl
}: {
  align: "start" | "end";
  percent: string;
  name: string;
  code?: string;
  logoUrl?: string;
}) {
  const flag = (
    <TeamFlag
      code={code}
      name={name}
      logoUrl={logoUrl}
      className="h-5 w-5 md:h-6 md:w-6 shrink-0 rounded-[2px] text-[20px] md:text-[24px]"
    />
  );
  const pct = (
    <span className="text-sm md:text-[18px] font-[500] leading-[19px] text-black w-[60px]">
      {percent}
    </span>
  );
  const label = (
    <span className="truncate text-sm md:text-[18px] font-[500] leading-[19px] text-black">
      {name}
    </span>
  );

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 md:gap-3",
        align === "end" && "flex-row-reverse justify-start text-right"
      )}
    >
      {pct}
      {flag}
      {label}
    </div>
  );
}

function TeamResultSide({
  align,
  outcome,
  name,
  code,
  logoUrl
}: {
  align: "start" | "end";
  outcome?: TeamMatchOutcome;
  name: string;
  code?: string;
  logoUrl?: string;
}) {
  const flag = (
    <TeamFlag
      code={code}
      name={name}
      logoUrl={logoUrl}
      className="h-6 w-6 shrink-0 rounded-[2px] text-[24px]"
    />
  );
  const pill = outcome ? <OutcomePill outcome={outcome} /> : null;
  const label = (
    <span className="truncate text-base font-[500] leading-[19px] text-black">
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
      {pill}
      {flag}
      {label}
    </div>
  );
}

function OutcomePill({ outcome }: { outcome: TeamMatchOutcome }) {
  const styles = getOutcomePillStyles(outcome);

  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-[18px] h-[34px] text-[14px] font-[500] leading-[14px]"
      style={{ background: styles.background, color: styles.color }}
    >
      {getOutcomePillLabel(outcome)}
    </span>
  );
}

function VolumeColumn({ amount }: { amount: string }) {
  return (
    <div className="flex flex-1 md:flex-grow-0 md:w-full shrink-0 flex-col items-end sm:w-[88px]">
      <strong className="text-lg font-[500] leading-[21px] text-black">
        {amount}
      </strong>
      <span className="text-xs font-normal leading-[14px] text-[#909090]">
        Volume
      </span>
    </div>
  );
}
