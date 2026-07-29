"use client";

import { useMemo } from "react";

import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { useGameTeamStats } from "@/hooks/market/use-game-team-stats";
import { cn } from "@/lib/cn";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import type { TeamMarketSnapshot, WorldCupMatch } from "@/types/market";
import { RecentMatches } from "@/views/trade/game/stats/recent-matches";
import { TeamStrength } from "@/views/trade/game/stats/team-strength";
import { UsualLineup } from "@/views/trade/game/stats/usual-lineup";

export type GameStatsSectionProps = {
  match: WorldCupMatch;
  teamSnapshots: TeamMarketSnapshot[];
  gameSnapshotHomeTeamId?: string;
  className?: string;
};

export function GameStatsSection({
  match,
  teamSnapshots,
  className
}: GameStatsSectionProps) {
  const sides = useMemo(
    () => resolveMatchSides(match, teamSnapshots),
    [match, teamSnapshots]
  );

  const homeTeamName = sides.home.name;
  const awayTeamName = sides.away.name;
  const homeDisplayName = useLocalizedTeamName(sides.home.code, homeTeamName);
  const awayDisplayName = useLocalizedTeamName(sides.away.code, awayTeamName);

  const {
    homeFixtures,
    awayFixtures,
    homeStrength,
    awayStrength,
    homeLineup,
    awayLineup,
    isLoading: teamsStatsLoading,
    isError: teamsStatsError,
    isLineupError
  } = useGameTeamStats({
    homePolymarketTeamId: match.homePolymarketTeamId,
    awayPolymarketTeamId: match.awayPolymarketTeamId,
    homeApiTeamId: match.homeApiTeamId,
    awayApiTeamId: match.awayApiTeamId
  });

  const homeTeam = {
    name: homeDisplayName,
    code: sides.home.code,
    logoUrl: sides.home.logoUrl
  };
  const awayTeam = {
    name: awayDisplayName,
    code: sides.away.code,
    logoUrl: sides.away.logoUrl
  };

  return (
    <div className={cn("mt-[8px] flex flex-col gap-4", className)}>
      <RecentMatches
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeRows={homeFixtures}
        awayRows={awayFixtures}
        isLoading={teamsStatsLoading}
        isError={teamsStatsError}
      />

      <TeamStrength
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeStrength={homeStrength}
        awayStrength={awayStrength}
        isLoading={teamsStatsLoading}
        isError={teamsStatsError}
      />

      <UsualLineup
        homeLineup={homeLineup}
        awayLineup={awayLineup}
        isLoading={teamsStatsLoading}
        isError={isLineupError}
      />
    </div>
  );
}
