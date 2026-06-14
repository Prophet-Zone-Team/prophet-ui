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
import { useTranslations } from "next-intl";

import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";

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
  const t = useTranslations("home");
  const tTrade = useTranslations("trade");
  const liveMatch = useMatchWithLiveState(match);
  const sides = resolveMatchSides(liveMatch, snapshots);
  const canNavigate = getScheduleRowVariant(liveMatch.status) !== "ended";
  const homeName = sides.home.name;
  const awayName = sides.away.name;
  const homeDisplayName = useLocalizedTeamName(sides.home.code, homeName);
  const awayDisplayName = useLocalizedTeamName(sides.away.code, awayName);
  const oddsResult = parseMatchOutcomeOdds(liveMatch, homeName, awayName);
  const liveClock = useLiveElapsedClock(
    liveMatch.liveElapsedSeconds,
    liveMatch.status === "live"
  );
  const scoreLabel = formatMatchScore(liveMatch.homeScore, liveMatch.awayScore);
  const rowVariant = getScheduleRowVariant(liveMatch.status);
  const statusLabel =
    rowVariant === "ongoing"
      ? t("matchStatusOngoing")
      : rowVariant === "upcoming"
        ? t("matchStatusUpcoming")
        : t("matchStatusEnded");

  const ariaLabel = [
    t("specialMatchAria", { home: homeDisplayName, away: awayDisplayName }),
    t("specialMatchScoreAria", { score: scoreLabel }),
    statusLabel,
    oddsResult.status === "ready"
      ? t("specialMatchWinProbabilitiesAria", {
          homePct: formatOutcomePercent(oddsResult.probabilities.home),
          drawPct: formatOutcomePercent(oddsResult.probabilities.draw),
          awayPct: formatOutcomePercent(oddsResult.probabilities.away)
        })
      : undefined,
    liveClock
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <article
      className={cn(
        "relative min-h-[160px] overflow-hidden rounded-[12px] border border-[#EBEBEB] bg-white sm:min-h-[280px] lg:min-h-[345px]",
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
          homeName={homeDisplayName}
          awayName={awayDisplayName}
          drawLabel={tTrade("draw")}
          probabilities={oddsResult.probabilities}
        />
      ) : (
        <div className="absolute inset-0 z-0 bg-[#f4f6f9]" aria-hidden />
      )}

      <div className="relative z-10 flex justify-center pt-[18px] px-[15px] md:pt-[50px] md:px-2 md:px-0">
        <div className="w-full flex justify-center items-center h-[72px] rounded-[10px] md:w-[568px] md:h-[138px] md:rounded-[20px] bg-white px-2 md:px-4 py-3 md:py-4 shadow-[0_8px_32px_rgba(15,23,42,0.08)] sm:px-8 sm:py-5">
          <div className="flex items-center justify-around relative w-full">
            <TeamColumn
              name={homeDisplayName}
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
                    label={t("matchStatusOngoing")}
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
                  <div className="md:text-[14px] text-[12px] text-[#9D84FF] font-[500]">
                    {t("nextMatch")}
                  </div>
                  <div className="text-[24px] md:text-[36px] text-[#909090] font-[500]">
                    {t("versus")}
                  </div>
                  <div className="text-[10px] md:text-[16px] text-[#000] font-[400]">
                    {t("startsAt", {
                      kickoff: formatScheduleKickoff(liveMatch.kickoffAt)
                    })}
                  </div>
                </>
              )}
            </div>

            <TeamColumn
              name={awayDisplayName}
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
    <div className={cn("flex min-w-0 flex-col gap-1 md:gap-2 items-center")}>
      <TeamFlag
        code={code}
        name={name}
        logoUrl={logoUrl}
        className="h-[20px] md:h-[50px] w-[20px] rounded-[4px] md:w-[50px] md:rounded-[6px] text-[20px] md:text-[50px]"
      />
      <strong className="max-w-full truncate text-[14px] md:text-[26px] font-[500] md:leading-[31px] text-black">
        {name}
      </strong>
    </div>
  );
}

function ProbabilityStrip({
  homeName,
  awayName,
  drawLabel,
  probabilities
}: {
  homeName: string;
  awayName: string;
  drawLabel: string;
  probabilities: { home: number; draw: number; away: number };
}) {
  const [slantPx, setContainerRef] = useSlantOffsetPx();
  const slant = Math.round(slantPx);
  const { homeClip, drawClip, awayClip, homeEnd } = buildProbabilityClips(
    probabilities,
    slant
  );
  return (
    <div ref={setContainerRef} className="absolute inset-0" aria-hidden>
      <div className="absolute inset-0 z-0">
        <ProbabilitySegmentFill background="#3168FF" clipPath={homeClip} />
        <ProbabilitySegmentFill background="#D9D9D9" clipPath={drawClip} />
        <ProbabilitySegmentFill background="#F4B600" clipPath={awayClip} />
      </div>

      <div className="pointer-events-none absolute inset-0 z-30">
        <ProbabilitySegmentLabel
          label={homeName}
          probability={probabilities.home}
          tone="light"
          percentClassName="text-[24px] leading-[29px] sm:text-[36px] sm:leading-[43px] lg:text-[52px] lg:leading-[62px]"
          align="start"
        />
        <ProbabilitySegmentLabel
          label={drawLabel}
          probability={probabilities.draw}
          tone="dark"
          align="start"
          contentLeft={`calc(${homeEnd}% + clamp(16px, 4vw, 60px))`}
        />
        <ProbabilitySegmentLabel
          label={awayName}
          probability={probabilities.away}
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
  probability,
  tone,
  percentClassName,
  align = "start",
  contentLeft
}: {
  label: string;
  probability: number;
  tone: "light" | "dark";
  percentClassName?: string;
  align?: "start" | "center" | "end";
  contentLeft?: string;
}) {
  const textColor = tone === "light" ? "text-white" : "text-black";
  const showPercent = Math.round(probability * 100) >= 10;

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div
        className={cn(
          "absolute bottom-3 z-30 flex max-w-[min(100%,280px)] flex-col gap-0.5 sm:bottom-8",
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
        {showPercent ? (
          <>
            <span className="relative z-30 text-[12px] font-semibold leading-[14px] sm:text-[16px] sm:leading-[19px]">
              {label}
            </span>
            <span
              className={cn(
                "relative z-30 text-[24px] font-semibold leading-[29px] sm:text-[36px] sm:leading-[43px]",
                percentClassName,
                textColor
              )}
            >
              {formatOutcomePercent(probability)}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
