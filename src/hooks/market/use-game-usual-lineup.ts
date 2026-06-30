"use client";

import { useTeamLineup } from "@/hooks/team/use-team-lineup";

const INVALID_TEAM_NAME = "TBD";

function isValidTeamName(name: string): boolean {
  return Boolean(name?.trim()) && name !== INVALID_TEAM_NAME;
}

export function useGameUsualLineup(params: {
  homeTeamName: string;
  awayTeamName: string;
}) {
  const homeEnabled = isValidTeamName(params.homeTeamName);
  const awayEnabled = isValidTeamName(params.awayTeamName);

  const homeQuery = useTeamLineup(homeEnabled ? params.homeTeamName : "");
  const awayQuery = useTeamLineup(awayEnabled ? params.awayTeamName : "");

  const enabled = homeEnabled || awayEnabled;
  const isLoading =
    enabled && (homeQuery.isLoading || awayQuery.isLoading);
  const hasStarters =
    (homeQuery.lineup?.starters.length ?? 0) > 0 ||
    (awayQuery.lineup?.starters.length ?? 0) > 0;
  const isError =
    enabled &&
    !isLoading &&
    !hasStarters &&
    ((homeEnabled && homeQuery.isError) || (awayEnabled && awayQuery.isError));

  return {
    homeLineup: homeQuery.lineup,
    awayLineup: awayQuery.lineup,
    isLoading,
    isError
  };
}
