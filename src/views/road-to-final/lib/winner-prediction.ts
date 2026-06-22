import { getWorldCupTeamByIdOrCode } from "@/data/world-cup-2026/groups";
import type { WinnerPredictionPayload } from "@/types/prophet-api";

import { MATCH_LOOKUP } from "./bracket-config";
import type { KnockoutWinners } from "../types";

const TRADE_TIER_THRESHOLDS = [10, 100, 500, 1500, 5000] as const;
const MAX_GUESS_CHANCES = 5;

export function resolveTradePromptAmount(
  totalTradeUsdc: number,
  availableChances: number
): number | null {
  if (availableChances >= MAX_GUESS_CHANCES || totalTradeUsdc >= 5000) {
    return null;
  }

  const nextThreshold = TRADE_TIER_THRESHOLDS.find(
    (threshold) => totalTradeUsdc < threshold
  );

  if (!nextThreshold) {
    return null;
  }

  return Math.ceil(nextThreshold - totalTradeUsdc);
}

function resolveTeamCode(teamId: string): string {
  return getWorldCupTeamByIdOrCode(teamId)?.code ?? teamId.toUpperCase();
}

function collectWinnersByStage(
  knockoutWinners: KnockoutWinners,
  stage: string
): string[] {
  const teamIds: string[] = [];

  for (const [matchId, teamId] of Object.entries(knockoutWinners)) {
    const match = MATCH_LOOKUP.get(Number(matchId));

    if (match?.stage === stage && teamId) {
      teamIds.push(resolveTeamCode(teamId));
    }
  }

  return teamIds.sort((a, b) => {
    const matchIdA = findMatchIdForTeam(knockoutWinners, stage, a);
    const matchIdB = findMatchIdForTeam(knockoutWinners, stage, b);
    return matchIdA - matchIdB;
  });
}

function findMatchIdForTeam(
  knockoutWinners: KnockoutWinners,
  stage: string,
  teamCode: string
): number {
  for (const [matchId, teamId] of Object.entries(knockoutWinners)) {
    const match = MATCH_LOOKUP.get(Number(matchId));

    if (
      match?.stage === stage &&
      resolveTeamCode(teamId) === teamCode
    ) {
      return Number(matchId);
    }
  }

  return 0;
}

export function buildWinnerPredictionPayload(
  knockoutWinners: KnockoutWinners
): WinnerPredictionPayload {
  const championTeamId = knockoutWinners[104];
  const finalTeams = collectWinnersByStage(knockoutWinners, "FINAL");

  return {
    champion_team: championTeamId
      ? resolveTeamCode(championTeamId)
      : "",
    final_teams: finalTeams,
    round_16_teams: collectWinnersByStage(knockoutWinners, "R16"),
    round_8_teams: collectWinnersByStage(knockoutWinners, "QF"),
    round_4_teams: collectWinnersByStage(knockoutWinners, "SF")
  };
}

export function formatPredictionRecordPath(
  prediction: WinnerPredictionPayload
): string {
  const championCode =
    resolveTeamCode(prediction.champion_team) ||
    prediction.champion_team.toUpperCase();
  const segments: string[] = [];

  for (const roundTeams of [
    prediction.round_16_teams,
    prediction.round_8_teams,
    prediction.round_4_teams,
    prediction.final_teams
  ]) {
    const codes = roundTeams.map((team) => resolveTeamCode(team));

    if (!codes.includes(championCode)) {
      continue;
    }

    const opponent = codes.find((code) => code !== championCode);

    if (opponent) {
      segments.push(`${championCode} vs ${opponent}`);
    }
  }

  segments.push(championCode);

  return segments.join(" > ");
}

export function resolveChampionDisplayName(championTeam: string): string {
  const team = getWorldCupTeamByIdOrCode(championTeam);
  return team?.name ?? championTeam;
}
