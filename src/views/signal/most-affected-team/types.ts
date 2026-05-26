export type MostAffectedTeamEntry = {
  id: string;
  rank: number;
  teamCode: string;
  teamName: string;
  netImpact: number;
  highImpactEventCount: number;
};

export type MostAffectedTeamData = {
  entries: MostAffectedTeamEntry[];
};
