import { findCuratedTeamById } from "@/data/teams/curated-team-list";
import { getTeamFootballMetadata } from "@/data/teams/football-metadata";
import type { WorldCup2026GroupTeam } from "@/data/world-cup-2026/groups";
import { formatWinnerProbabilityLabel } from "@/lib/market/map-winner-probability";
import { getTeamStrength } from "../lib/team-strength";

export type TeamTooltipStats = {
  teamName: string;
  teamCode: string;
  confederation: string;
  fifaRankLabel: string;
  winnerProbabilityLabel: string;
  valueLabel: string;
  strengthLabel: string;
};

function formatSquadValue(value: number, currency = "EUR"): string {
  if (value >= 1_000_000_000) {
    const billions = value / 1_000_000_000;
    const symbol = currency === "EUR" ? "€" : "$";
    return `${symbol}${billions.toFixed(2)}B`;
  }

  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const symbol = currency === "EUR" ? "€" : "$";
    return `${symbol}${millions.toFixed(0)}M`;
  }

  return "—";
}

function resolveConfederation(teamId: string): string {
  return findCuratedTeamById(teamId)?.region ?? "—";
}

export function buildTeamTooltipStats(
  team: WorldCup2026GroupTeam,
  winnerProbability?: number
): TeamTooltipStats {
  const metadata = getTeamFootballMetadata(team.id);
  const fifaRank = metadata?.fifaRank;
  const squadValue = metadata?.squadValue ?? 0;
  const teamStrength = getTeamStrength(team.id);

  return {
    teamName: team.name,
    teamCode: team.code,
    confederation: resolveConfederation(team.id),
    fifaRankLabel: fifaRank && fifaRank < 999 ? `#${fifaRank}` : "—",
    winnerProbabilityLabel:
      winnerProbability !== undefined
        ? formatWinnerProbabilityLabel(winnerProbability)
        : "—",
    valueLabel: squadValue > 0
      ? formatSquadValue(squadValue, metadata?.squadValueCurrency)
      : "—",
    strengthLabel: teamStrength > 0 ? String(teamStrength) : "—"
  };
}
