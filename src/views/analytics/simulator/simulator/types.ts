export type SimulatorTeam = {
  id: string;
  teamCode: string;
  teamName: string;
  logoUrl?: string;
};

export type PathDifficulty = "Easy" | "Medium" | "Hard";

export type SimulatorSnapshot = {
  currentStage: string;
  pathDifficulty: PathDifficulty;
  biggestOpponent: string;
  biggestOpponentName?: string;
  biggestOpponentRound?: string;
  biggestOpponentTeamCode?: string;
};
