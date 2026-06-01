"use client";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";

export const GAME_STATISTIC_LABELS = [
  "Possession",
  "Shots",
  "Shots on Target",
  "Shots off Target",
  "Fouls",
  "Yellow Cards",
  "Red Cards",
  "Corners",
  "Free Kicks"
] as const;

export type GameStatisticLabel = (typeof GAME_STATISTIC_LABELS)[number];

export type GameStatisticsTeam = {
  name: string;
  code?: string;
  logoUrl?: string;
};

export type GameStatisticsProps = {
  homeTeam: GameStatisticsTeam;
  awayTeam: GameStatisticsTeam;
  className?: string;
};

const STAT_BAR_HEIGHT_CLASS = "h-2";
const STAT_BAR_RADIUS_CLASS = "rounded-[4px]";
const STAT_BAR_TRACK_COLOR = "#ECECEC";
const STAT_BAR_HIGHER_COLOR = "#7BCA25";
const STAT_BAR_LOWER_COLOR = "#909090";

function StatComparisonBar({
  value,
  compareValue,
  side
}: {
  value: number;
  compareValue: number;
  side: "home" | "away";
}) {
  const total = value + compareValue;
  const fillPercent = total > 0 ? (value / total) * 100 : 0;
  const fillColor =
    value > compareValue
      ? STAT_BAR_HIGHER_COLOR
      : value < compareValue
        ? STAT_BAR_LOWER_COLOR
        : STAT_BAR_LOWER_COLOR;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        STAT_BAR_HEIGHT_CLASS,
        STAT_BAR_RADIUS_CLASS
      )}
      style={{ backgroundColor: STAT_BAR_TRACK_COLOR }}
    >
      <div
        className={cn(
          "absolute top-0 h-full",
          STAT_BAR_RADIUS_CLASS,
          side === "home" ? "right-0" : "left-0"
        )}
        style={{
          width: `${fillPercent}%`,
          backgroundColor: fillColor
        }}
      />
    </div>
  );
}

function StatRow({ label }: { label: GameStatisticLabel }) {
  const homeValue = 0;
  const awayValue = 0;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(180px,auto)_minmax(0,1fr)] w-full">
      <div className="flex items-center gap-[10px]">
        <span className="text-right text-[14px] font-[400] leading-[18px] text-black">
          {homeValue}
        </span>
        <StatComparisonBar
          value={homeValue}
          compareValue={awayValue}
          side="home"
        />
      </div>
      <span className="text-center shrink-0 w-[180px] text-[14px] font-[500] leading-[18px] text-black">
        {label}
      </span>
      <div className="flex items-center gap-[10px]">
        <StatComparisonBar
          value={awayValue}
          compareValue={homeValue}
          side="away"
        />
        <span className="text-[14px] font-[400] leading-[18px] text-black">
          {awayValue}
        </span>
      </div>
    </div>
  );
}

function TeamHeaderSide({
  team,
  align
}: {
  team: GameStatisticsTeam;
  align: "start" | "end";
}) {
  const flag = (
    <TeamFlag
      code={team.code}
      name={team.name}
      logoUrl={team.logoUrl}
      className="h-[26px] w-[26px] shrink-0 rounded-[4px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
    />
  );

  return (
    <div
      className={cn(
        "flex w-1/2 items-center gap-2 justify-end",
        align === "end" && "flex-row-reverse"
      )}
    >
      <span className="truncate text-[16px] font-[500] leading-[20px] text-black">
        {team.name}
      </span>
      {flag}
    </div>
  );
}

export function GameStatistics({
  homeTeam,
  awayTeam,
  className
}: GameStatisticsProps) {
  return (
    <section
      aria-label="Match statistics"
      className={cn(
        "w-full rounded-[12px] border border-[#EBEBEB] bg-white px-4 py-4 sm:px-5",
        className
      )}
    >
      <h2 className="m-0 text-[18px] font-[500] leading-[23px] text-black">
        Statistics
      </h2>

      <div className="mt-3 flex items-center gap-[180px]">
        <TeamHeaderSide team={homeTeam} align="start" />
        <TeamHeaderSide team={awayTeam} align="end" />
      </div>

      <div className="mt-6 flex flex-col gap-[30px]">
        {GAME_STATISTIC_LABELS.map((label: GameStatisticLabel) => (
          <StatRow key={label} label={label} />
        ))}
      </div>
    </section>
  );
}
