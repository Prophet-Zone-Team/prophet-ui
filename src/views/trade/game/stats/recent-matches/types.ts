export type RecentFixtureResult = "win" | "draw" | "lose";

export type RecentFixtureRow = {
  id: string;
  date: string;
  opponent: string;
  result: RecentFixtureResult;
  score: string;
  competition: string;
};

export type RecentFixturesTeamColumn = {
  name: string;
  code?: string;
  logoUrl?: string;
  rows: RecentFixtureRow[];
};
