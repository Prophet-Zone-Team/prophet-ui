export function formatMatchHistoryDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(isoDate));
}

export function formatMatchScore(homeScore: number, awayScore: number): string {
  return `${homeScore} - ${awayScore}`;
}
