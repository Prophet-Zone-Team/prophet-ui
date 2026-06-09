export function parseMatchScoreString(
  score: string | undefined
): { homeScore?: number; awayScore?: number } {
  if (!score) {
    return {};
  }

  const match = score.match(/(\d+)\s*[-:]\s*(\d+)/);

  if (!match) {
    return {};
  }

  return {
    homeScore: Number(match[1]),
    awayScore: Number(match[2]),
  };
}
