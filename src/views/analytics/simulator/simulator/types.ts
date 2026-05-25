export type SimulatorTeam = {
  id: string;
  teamCode: string;
  teamName: string;
};

export type PathDifficulty = "Easy" | "Medium" | "Hard";

export type SimulatorSnapshot = {
  currentStage: string;
  pathDifficulty: PathDifficulty;
  biggestOpponent: string;
};
