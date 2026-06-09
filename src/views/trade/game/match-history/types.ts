export type MatchHistoryResultKind =
  | "win"
  | "draw"
  | "lose"
  | "lost-penalties";

export type MatchHistoryEntry = {
  id: string;
  playedAt: string;
  format: string;
  homeCode: string;
  awayCode: string;
  homeScore: number;
  awayScore: number;
  penaltyScore?: string;
  result: MatchHistoryResultKind;
};

export type MatchHistoryTeamOption = {
  id: string;
  code: string;
  flagCode: string;
  name: string;
  matches: MatchHistoryEntry[];
};
