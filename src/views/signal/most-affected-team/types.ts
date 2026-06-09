export type MostAffectedTeamEntry = {
  id: string;
  rank: number;
  teamCode: string;
  teamName: string;
  netImpact: number;
  highImpactEventCount: number;
  link?: string;
};

export type MostAffectedTeamData = {
  entries: MostAffectedTeamEntry[];
};
