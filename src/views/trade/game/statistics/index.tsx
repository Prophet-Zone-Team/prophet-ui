"use client";

import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import type { GameStatisticsRowData } from "@/lib/market/map-game-statistics";
import type { GameStatisticLabel } from "@/lib/market/map-game-statistics";

export {
  GAME_STATISTIC_LABELS,
  type GameStatisticLabel
} from "@/lib/market/map-game-statistics";

export type GameStatisticsTeam = {
  name: string;
  code?: string;
  logoUrl?: string;
};

export type GameStatisticsProps = {
  homeTeam: GameStatisticsTeam;
  awayTeam: GameStatisticsTeam;
  rows: GameStatisticsRowData[];
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
};

const STAT_BAR_HEIGHT_CLASS = "h-2";
const STAT_BAR_RADIUS_CLASS = "rounded-[4px]";
const STAT_BAR_TRACK_COLOR = "#ECECEC";
const STAT_BAR_HIGHER_COLOR = "#7BCA25";
const STAT_BAR_LOWER_COLOR = "#909090";

const GAME_STAT_LABEL_KEYS: Record<
  GameStatisticLabel,
  "gameStatPossession" | "gameStatShots" | "gameStatShotsOnTarget" | "gameStatShotsOffTarget" | "gameStatFouls" | "gameStatYellowCards" | "gameStatRedCards" | "gameStatCorners" | "gameStatFreeKicks"
> = {
  Possession: "gameStatPossession",
  Shots: "gameStatShots",
  "Shots on Target": "gameStatShotsOnTarget",
  "Shots off Target": "gameStatShotsOffTarget",
  Fouls: "gameStatFouls",
  "Yellow Cards": "gameStatYellowCards",
  "Red Cards": "gameStatRedCards",
  Corners: "gameStatCorners",
  "Free Kicks": "gameStatFreeKicks"
};

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

function StatRow({
  label,
  homeValue,
  awayValue
}: {
  label: string;
  homeValue: number;
  awayValue: number;
}) {
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
  rows,
  isLoading = false,
  isError = false,
  className
}: GameStatisticsProps) {
  const t = useTranslations("trade");

  return (
    <section
      aria-label={t("statisticsAria")}
      className={cn(
        "hidden w-full rounded-[12px] border border-[#EBEBEB] bg-white px-4 py-4 sm:px-5 md:block",
        className
      )}
    >
      <h2 className="m-0 text-[18px] font-[500] leading-[23px] text-black">
        {t("statistics")}
      </h2>

      <div className="mt-3 flex items-center gap-[180px]">
        <TeamHeaderSide team={homeTeam} align="start" />
        <TeamHeaderSide team={awayTeam} align="end" />
      </div>

      <div className="mt-6 flex flex-col gap-[30px]">
        {isLoading ? (
          <p className="py-6 text-center text-[14px] font-[400] leading-[17px] text-[#909090]">
            {t("loadingData")}
          </p>
        ) : isError ? (
          <p className="py-6 text-center text-[14px] font-[400] leading-[17px] text-[#909090]">
            {t("unableToLoadData")}
          </p>
        ) : (
          rows.map((row) => (
            <StatRow
              key={row.label}
              label={t(GAME_STAT_LABEL_KEYS[row.label])}
              homeValue={row.homeValue}
              awayValue={row.awayValue}
            />
          ))
        )}
      </div>
    </section>
  );
}
