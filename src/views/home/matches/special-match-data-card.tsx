"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";

import { MatchStatusBadge } from "@/components/match/match-status-badge";
import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import { formatMatchScore } from "@/lib/market/match-display";
import {
  buildProbabilityClips,
  getSlantOffsetPx
} from "@/lib/market/match-probability-bar";
import {
  formatOutcomePercent,
  parseMatchOutcomeOdds
} from "@/lib/market/match-outcome-odds";
import {
  formatScheduleKickoff,
  getScheduleRowVariant,
  resolveMatchSides
} from "@/lib/market/schedule-match";
import { gameTradeHref } from "@/lib/routes/trade";
import { useLiveElapsedClock } from "@/lib/market/use-live-elapsed-clock";
import { useFeaturedScheduleMatch, useMatchWithLiveState } from "@/store/match-live-store";
import type { TeamMarketSnapshot, WorldCupMatch } from "@/types/market";

function useSlantOffsetPx(): [number, (node: HTMLDivElement | null) => void] {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [slantPx, setSlantPx] = useState(() => getSlantOffsetPx(345));

  useLayoutEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const update = () => {
      const rect = element.getBoundingClientRect();
      setSlantPx(getSlantOffsetPx(rect.height, rect.width));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const setContainerRef = (node: HTMLDivElement | null) => {
    containerRef.current = node;
  };

  return [slantPx, setContainerRef];
}

export interface SpecialMatchDataCardProps {
  matches: WorldCupMatch[];
  snapshots?: TeamMarketSnapshot[];
}

export function SpecialMatchDataCard({
  matches,
  snapshots = []
}: SpecialMatchDataCardProps) {
  const featuredMatch = useFeaturedScheduleMatch(matches);

  if (!featuredMatch) {
    return null;
  }

  return (
    <SpecialMatchDataCardContent match={featuredMatch} snapshots={snapshots} />
  );
}

function SpecialMatchDataCardContent({
  match,
  snapshots = []
}: {
  match: WorldCupMatch;
  snapshots?: TeamMarketSnapshot[];
}) {
  const router = useRouter();
  const liveMatch = useMatchWithLiveState(match);
  const sides = resolveMatchSides(liveMatch, snapshots);
  const canNavigate = getScheduleRowVariant(liveMatch.status) !== "ended";
  const homeName = sides.home.name;
  const awayName = sides.away.name;
  const oddsResult = parseMatchOutcomeOdds(liveMatch, homeName, awayName);
  const liveClock = useLiveElapsedClock(
    liveMatch.liveElapsedSeconds,
    liveMatch.status === "live"
  );
  const scoreLabel = formatMatchScore(liveMatch.homeScore, liveMatch.awayScore);

  const ariaLabel = [
    `${homeName} vs ${awayName}`,
    `Score ${scoreLabel}`,
    liveMatch.status === "live" ? "ongoing" : liveMatch.status,
    oddsResult.status === "ready"
      ? `Win probabilities ${formatOutcomePercent(oddsResult.probabilities.home)} home, ${formatOutcomePercent(oddsResult.probabilities.draw)} draw, ${formatOutcomePercent(oddsResult.probabilities.away)} away`
      : undefined,
    liveClock
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <article
      className={cn(
        "relative min-h-[220px] overflow-hidden rounded-[12px] border border-[#EBEBEB] bg-white sm:min-h-[280px] lg:min-h-[345px]",
        canNavigate &&
          "cursor-pointer transition-colors hover:border-[#d0d0d0] hover:bg-[#fafbfc]"
      )}
      aria-label={ariaLabel}
      onClick={
        canNavigate
          ? () => {
              router.push(gameTradeHref(match.id));
            }
          : undefined
      }
    >
      {oddsResult.status === "ready" ? (
        <ProbabilityStrip
          homeName={homeName}
          awayName={awayName}
          probabilities={oddsResult.probabilities}
        />
      ) : (
        <div className="absolute inset-0 z-0 bg-[#f4f6f9]" aria-hidden />
      )}

      <div className="relative z-10 flex justify-center pt-[50px] px-2 md:px-0">
        <div className="w-full flex justify-center items-center md:w-[568px] h-[138px] rounded-[20px] bg-white px-2 md:px-4 py-3 md:py-4 shadow-[0_8px_32px_rgba(15,23,42,0.08)] sm:px-8 sm:py-5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 relative">
            <TeamColumn
              name={homeName}
              code={sides.home.code}
              logoUrl={sides.home.logoUrl}
              align="start"
            />

            <div className="flex min-w-[88px] flex-col items-center text-center">
              {liveMatch.status === "live" ? (
                <>
                  <MatchStatusBadge
                    variant="ongoing"
                    className="font-semibold"
                  />
                  <strong className="text-[22px] md:text-[28px] font-semibold leading-none text-black sm:text-4xl">
                    {scoreLabel}
                  </strong>
                  {liveClock ? (
                    <span className="text-sm md:text-base font-normal text-black">
                      {liveClock}
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="text-[14px] text-[#9D84FF] font-[556]">
                    Next Match
                  </div>
                  <div className="text-[30px] md:text-[36px] text-[#909090] font-[556]">
                    VS
                  </div>
                  <div className="text-sm md:text-[16px] text-[#000] font-[457]">
                    Starts {formatScheduleKickoff(liveMatch.kickoffAt)}
                  </div>
                </>
              )}
            </div>

            <TeamColumn
              name={awayName}
              code={sides.away.code}
              logoUrl={sides.away.logoUrl}
              align="end"
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function TeamColumn({
  name,
  code,
  logoUrl,
  align
}: {
  name: string;
  code?: string;
  logoUrl?: string;
  align: "start" | "end";
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2 items-center")}>
      <TeamFlag
        code={code}
        name={name}
        logoUrl={logoUrl}
        className="h-[40px] md:h-[50px] w-[40px] md:w-[50px] rounded-[6px] text-[40px] md:text-[50px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />
      <strong className="max-w-full truncate text-base md:text-[26px] font-[556] leading-[31px] text-black">
        {name}
      </strong>
    </div>
  );
}

function ProbabilityStrip({
  homeName,
  awayName,
  probabilities
}: {
  homeName: string;
  awayName: string;
  probabilities: { home: number; draw: number; away: number };
}) {
  const [slantPx, setContainerRef] = useSlantOffsetPx();
  const slant = Math.round(slantPx);
  const { homeClip, drawClip, awayClip, homeEnd } = buildProbabilityClips(
    probabilities,
    slant
  );
  const homePct = formatOutcomePercent(probabilities.home);
  const drawPct = formatOutcomePercent(probabilities.draw);
  const awayPct = formatOutcomePercent(probabilities.away);

  return (
    <div
      ref={setContainerRef}
      className="absolute inset-0 min-h-[345px]"
      aria-hidden
    >
      <div className="absolute inset-0 z-0">
        <ProbabilitySegmentFill background="#3168FF" clipPath={homeClip} />
        <ProbabilitySegmentFill background="#D9D9D9" clipPath={drawClip} />
        <ProbabilitySegmentFill background="#F4B600" clipPath={awayClip} />
      </div>

      <div className="pointer-events-none absolute inset-0 z-30">
        <ProbabilitySegmentLabel
          label={homeName}
          percent={homePct}
          tone="light"
          percentClassName="text-[36px] sm:text-[52px] sm:leading-[62px]"
          align="start"
        />
        <ProbabilitySegmentLabel
          label="Draw"
          percent={drawPct}
          tone="dark"
          align="start"
          contentLeft={`calc(${homeEnd}% + 60px)`}
        />
        <ProbabilitySegmentLabel
          label={awayName}
          percent={awayPct}
          tone="dark"
          align="end"
        />
      </div>
    </div>
  );
}

function ProbabilitySegmentFill({
  background,
  clipPath
}: {
  background: string;
  clipPath: string;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0"
      style={{ background, clipPath }}
    />
  );
}

function ProbabilitySegmentLabel({
  label,
  percent,
  tone,
  percentClassName,
  align = "start",
  contentLeft
}: {
  label: string;
  percent: string;
  tone: "light" | "dark";
  percentClassName?: string;
  align?: "start" | "center" | "end";
  contentLeft?: string;
}) {
  const textColor = tone === "light" ? "text-white" : "text-black";

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div
        className={cn(
          "absolute bottom-5 z-30 flex max-w-[min(100%,280px)] flex-col gap-0.5 sm:bottom-8",
          align === "end" && "right-0 items-end px-4 text-right sm:px-6",
          align === "center" &&
            "left-1/2 -translate-x-1/2 items-center px-4 text-center sm:px-6",
          align === "start" &&
            !contentLeft &&
            "left-0 items-start px-4 text-left sm:px-6",
          align === "start" && contentLeft && "items-start text-left",
          textColor
        )}
        style={contentLeft ? { left: contentLeft } : undefined}
      >
        <span className="relative z-30 text-[16px] font-semibold leading-[19px]">
          {label}
        </span>
        <span
          className={cn(
            "relative z-30 text-[36px] font-semibold leading-[43px]",
            percentClassName,
            textColor
          )}
        >
          {percent}
        </span>
      </div>
    </div>
  );
}
