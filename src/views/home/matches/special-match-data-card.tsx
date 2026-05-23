"use client";

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
import { useLiveElapsedClock } from "@/lib/market/use-live-elapsed-clock";
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
  match: WorldCupMatch;
  home?: TeamMarketSnapshot;
  away?: TeamMarketSnapshot;
}

export function SpecialMatchDataCard({
  match,
  home,
  away
}: SpecialMatchDataCardProps) {
  const homeName = home?.team.name ?? match.homeSeed ?? "Home";
  const awayName = away?.team.name ?? match.awaySeed ?? "Away";
  const oddsResult = parseMatchOutcomeOdds(match, homeName, awayName);
  const liveClock = useLiveElapsedClock(
    match.liveElapsedSeconds,
    match.status === "live"
  );
  const scoreLabel = formatMatchScore(match.homeScore, match.awayScore);

  const ariaLabel = [
    `${homeName} vs ${awayName}`,
    `Score ${scoreLabel}`,
    match.status === "live" ? "ongoing" : match.status,
    oddsResult.status === "ready"
      ? `Win probabilities ${formatOutcomePercent(oddsResult.probabilities.home)} home, ${formatOutcomePercent(oddsResult.probabilities.draw)} draw, ${formatOutcomePercent(oddsResult.probabilities.away)} away`
      : undefined,
    liveClock
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <article
      className="relative min-h-[220px] overflow-hidden rounded-[12px] border border-[#EBEBEB] bg-white sm:min-h-[280px] lg:min-h-[345px]"
      aria-label={ariaLabel}
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

      <div className="relative z-10 flex justify-center px-3 pb-6 pt-4 sm:px-6 sm:pb-10 sm:pt-6">
        <div className="w-full max-w-[568px] rounded-[20px] bg-white px-4 py-4 shadow-[0_8px_32px_rgba(15,23,42,0.08)] sm:px-8 sm:py-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-6">
            <TeamColumn name={homeName} code={home?.team.code} align="start" />

            <div className="flex min-w-[88px] flex-col items-center gap-1 text-center">
              {match.status === "live" ? (
                <MatchStatusBadge variant="ongoing" className="font-semibold" />
              ) : null}
              <strong className="text-[28px] font-semibold leading-none text-black sm:text-4xl">
                {scoreLabel}
              </strong>
              {liveClock ? (
                <span className="text-base font-normal text-black">
                  {liveClock}
                </span>
              ) : null}
            </div>

            <TeamColumn name={awayName} code={away?.team.code} align="end" />
          </div>
        </div>
      </div>
    </article>
  );
}

function TeamColumn({
  name,
  code,
  align
}: {
  name: string;
  code?: string;
  align: "start" | "end";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2",
        align === "end" ? "items-end text-right" : "items-start text-left"
      )}
    >
      <TeamFlag
        code={code}
        name={name}
        className="h-[50px] w-[50px] rounded-[6px] text-[40px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
      />
      <strong className="max-w-full truncate text-xl font-semibold text-black sm:text-[26px] sm:leading-[31px]">
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
          clipPath={homeClip}
          label={homeName}
          percent={homePct}
          tone="light"
          percentClassName="text-[36px] sm:text-[52px] sm:leading-[62px]"
          align="start"
        />
        <ProbabilitySegmentLabel
          clipPath={drawClip}
          label="Draw"
          percent={drawPct}
          tone="dark"
          align="start"
          contentLeft={`calc(${homeEnd}% + 60px)`}
        />
        <ProbabilitySegmentLabel
          clipPath={awayClip}
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
  clipPath,
  label,
  percent,
  tone,
  percentClassName,
  align = "start",
  contentLeft
}: {
  clipPath: string;
  label: string;
  percent: string;
  tone: "light" | "dark";
  percentClassName?: string;
  align?: "start" | "center" | "end";
  contentLeft?: string;
}) {
  const textColor = tone === "light" ? "text-white" : "text-black";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30"
      style={{ clipPath }}
    >
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
