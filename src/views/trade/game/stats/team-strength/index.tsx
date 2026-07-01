"use client";

import { useTranslations } from "next-intl";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer
} from "recharts";

import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { formatStrengthScore } from "@/lib/analytics/map-team-strength";
import { cn } from "@/lib/cn";
import type { StrengthMetric } from "@/lib/team/team-detail-model";
import type {
  TeamStrengthData,
  TeamStrengthTeam
} from "@/views/trade/game/stats/team-strength/types";

const RADAR_STROKE_COLOR = "#5983EC";
const RADAR_FILL_COLOR = "rgba(89, 131, 236, 0.4)";
const RADAR_GRID_COLOR = "#EBEBEB";
const RADAR_LABEL_COLOR = "#909090";

export type TeamStrengthProps = {
  homeTeam: TeamStrengthTeam;
  awayTeam: TeamStrengthTeam;
  homeStrength: TeamStrengthData;
  awayStrength: TeamStrengthData;
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
};

function TeamStrengthRadarChart({ metrics }: { metrics: StrengthMetric[] }) {
  if (metrics.length === 0) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center text-[14px] leading-[18px] text-[#909090]">
        —
      </div>
    );
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={metrics} outerRadius="72%">
          <PolarGrid gridType="polygon" stroke={RADAR_GRID_COLOR} />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={false}
            axisLine={false}
            tickCount={4}
          />
          <PolarAngleAxis
            dataKey="label"
            tick={{
              fill: RADAR_LABEL_COLOR,
              fontSize: 14,
              fontWeight: 400
            }}
          />
          <Radar
            dataKey="value"
            stroke={RADAR_STROKE_COLOR}
            fill={RADAR_FILL_COLOR}
            fillOpacity={1}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TeamStrengthColumn({
  team,
  strength
}: {
  team: TeamStrengthTeam;
  strength: TeamStrengthData;
}) {
  const t = useTranslations("trade");
  const displayName = useLocalizedTeamName(team.code, team.name);

  return (
    <div className="min-w-0 flex-1 px-3 py-3 md:px-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <TeamFlag
            code={team.code}
            name={team.name}
            logoUrl={team.logoUrl}
            className="h-[22px] w-[22px] shrink-0 rounded-[6px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
          />
          <span className="truncate text-[14px] font-[500] leading-[18px] text-black">
            {displayName}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[14px] font-[400] leading-[18px] text-[#909090]">
            {t("strengthScore")}
          </span>
          <span className="text-[20px] font-[500] leading-[25px] text-black">
            {formatStrengthScore(strength.score)}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <TeamStrengthRadarChart metrics={strength.metrics} />
      </div>
    </div>
  );
}

export function TeamStrength({
  homeTeam,
  awayTeam,
  homeStrength,
  awayStrength,
  isLoading = false,
  isError = false,
  className
}: TeamStrengthProps) {
  const t = useTranslations("trade");

  const columns = [
    { team: homeTeam, strength: homeStrength },
    { team: awayTeam, strength: awayStrength }
  ];

  const hasData =
    homeStrength.metrics.length > 0 || awayStrength.metrics.length > 0;

  return (
    <section
      aria-label={t("teamStrengthAria")}
      className={cn(
        "block w-full rounded-[12px] border border-[#EBEBEB] bg-white py-4",
        className
      )}
    >
      <h2 className="m-0 px-4 text-[18px] font-[500] leading-[23px] text-black sm:px-5">
        {t("teamStrength")}
      </h2>

      <div className="mt-3">
        {isLoading ? (
          <p className="px-4 py-6 text-center text-[14px] font-[400] leading-[17px] text-[#909090] sm:px-5">
            {t("loadingData")}
          </p>
        ) : isError ? (
          <p className="px-4 py-6 text-center text-[14px] font-[400] leading-[17px] text-[#909090] sm:px-5">
            {t("unableToLoadData")}
          </p>
        ) : !hasData ? (
          <p className="px-4 py-6 text-center text-[14px] font-[400] leading-[17px] text-[#909090] sm:px-5">
            {t("teamStrengthEmpty")}
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-[#EBEBEB] md:flex-row md:divide-x md:divide-y-0">
            {columns.map(({ team, strength }) => (
              <TeamStrengthColumn
                key={team.name}
                team={team}
                strength={strength}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
