import { formatDateFromIso } from "@/lib/formatters/datetime";

export function formatMatchHistoryDate(isoDate: string): string {
  return formatDateFromIso(isoDate);
}

export function formatMatchScore(homeScore: number, awayScore: number): string {
  return `${homeScore} - ${awayScore}`;
}
