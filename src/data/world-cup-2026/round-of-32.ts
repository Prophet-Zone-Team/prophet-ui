export interface RoundOf32MatchConfig {
  matchId: number;
  left: string;
  right: string;
  venue?: string;
}

export const ROUND_OF_32: RoundOf32MatchConfig[] = [
  { matchId: 73, left: "2A", right: "2B", venue: "Los Angeles Stadium" },
  { matchId: 74, left: "1E", right: "3ABCDF", venue: "Boston Stadium" },
  { matchId: 75, left: "1F", right: "2C", venue: "Estadio Monterrey" },
  { matchId: 76, left: "1C", right: "2F", venue: "Houston Stadium" },
  { matchId: 77, left: "1I", right: "3CDFGH", venue: "New York New Jersey Stadium" },
  { matchId: 78, left: "2E", right: "2I", venue: "Dallas Stadium" },
  { matchId: 79, left: "1A", right: "3CEFHI", venue: "Mexico City Stadium" },
  { matchId: 80, left: "1L", right: "3EHIJK", venue: "Dallas Stadium" },
  { matchId: 81, left: "1D", right: "3BEFIJ", venue: "Atlanta Stadium" },
  { matchId: 82, left: "1G", right: "3AEHIJ", venue: "Vancouver Stadium" },
  { matchId: 83, left: "2K", right: "2L", venue: "Miami Stadium" },
  { matchId: 84, left: "1H", right: "2J", venue: "Kansas City Stadium" },
  { matchId: 85, left: "1B", right: "3EFGIJ", venue: "Seattle Stadium" },
  { matchId: 86, left: "1J", right: "2H", venue: "Toronto Stadium" },
  { matchId: 87, left: "1K", right: "3DEIJL", venue: "Philadelphia Stadium" },
  { matchId: 88, left: "2D", right: "2G", venue: "San Francisco Bay Area Stadium" },
];
