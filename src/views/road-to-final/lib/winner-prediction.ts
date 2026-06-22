import { getWorldCupTeamByIdOrCode } from "@/data/world-cup-2026/groups";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";
import type {
  WinnerPredictionMatchPair,
  WinnerPredictionPayload,
} from "@/types/prophet-api";

import { resolveBracketSeed } from "./bracket-resolver";
import { MATCH_LOOKUP } from "./bracket-config";
import {
  getMaxTradeTierThreshold,
  MAX_GUESS_CHANCES,
  TRADE_ENTRY_TIERS,
} from "./trade-entry-tiers";
import type { GroupPlacements, KnockoutWinners } from "../types";

export function resolveTradePromptAmount(
  totalTradeUsdc: number,
  availableChances: number
): number | null {
  if (
    availableChances >= MAX_GUESS_CHANCES ||
    totalTradeUsdc >= getMaxTradeTierThreshold()
  ) {
    return null;
  }

  const nextTier = TRADE_ENTRY_TIERS.find(
    (tier) => totalTradeUsdc < tier.thresholdUsdc
  );

  if (!nextTier) {
    return null;
  }

  return Math.ceil(nextTier.thresholdUsdc - totalTradeUsdc);
}

function resolveTeamName(teamId: string): string {
  return getWorldCupTeamByIdOrCode(teamId)?.name ?? teamId;
}

function resolveTeamCode(teamRef: string): string {
  const team = getWorldCupTeamByIdOrCode(teamRef);
  return team?.code ?? teamRef.toUpperCase();
}

function resolveMatchTeamNames(
  matchId: number,
  placements: GroupPlacements,
  thirdPlaceOption: ThirdPlaceAllocationOption | undefined,
  knockoutWinners: KnockoutWinners
): string[] {
  const match = MATCH_LOOKUP.get(matchId);

  if (!match) {
    return [];
  }

  const teams: string[] = [];

  for (const seed of [match.left, match.right]) {
    const resolved = resolveBracketSeed(
      seed,
      match,
      placements,
      thirdPlaceOption,
      knockoutWinners
    );

    if (resolved.team) {
      teams.push(resolved.team.name);
    }
  }

  return teams;
}

function collectMatchPairingsByStage(
  stage: string,
  placements: GroupPlacements,
  thirdPlaceOption: ThirdPlaceAllocationOption | undefined,
  knockoutWinners: KnockoutWinners
): WinnerPredictionMatchPair[] {
  return [...MATCH_LOOKUP.values()]
    .filter((match) => match.stage === stage)
    .sort((a, b) => a.matchId - b.matchId)
    .map((match) => {
      const teams = resolveMatchTeamNames(
        match.matchId,
        placements,
        thirdPlaceOption,
        knockoutWinners
      );

      return teams.length >= 2 ? { teams } : null;
    })
    .filter((pair): pair is WinnerPredictionMatchPair => pair !== null);
}

export function buildWinnerPredictionPayload({
  knockoutWinners,
  placements,
  thirdPlaceOption,
}: {
  knockoutWinners: KnockoutWinners;
  placements: GroupPlacements;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
}): WinnerPredictionPayload {
  const championTeamId = knockoutWinners[104];

  // API fields name the team count in that round:
  // round_16_teams = Round of 16 (R16), 8 matches
  // round_8_teams  = Quarterfinal (QF), 4 matches
  // round_4_teams  = Semifinal (SF), 2 matches
  // final_teams    = Final (FINAL), 1 match
  return {
    champion_team: championTeamId ? resolveTeamName(championTeamId) : "",
    final_teams: collectMatchPairingsByStage(
      "FINAL",
      placements,
      thirdPlaceOption,
      knockoutWinners
    ),
    round_4_teams: collectMatchPairingsByStage(
      "SF",
      placements,
      thirdPlaceOption,
      knockoutWinners
    ),
    round_8_teams: collectMatchPairingsByStage(
      "QF",
      placements,
      thirdPlaceOption,
      knockoutWinners
    ),
    round_16_teams: collectMatchPairingsByStage(
      "R16",
      placements,
      thirdPlaceOption,
      knockoutWinners
    ),
  };
}

function teamMatchesChampion(teamRef: string, championTeam: string): boolean {
  const championLower = championTeam.toLowerCase();
  const team = getWorldCupTeamByIdOrCode(teamRef);

  return (
    teamRef.toLowerCase() === championLower ||
    team?.name.toLowerCase() === championLower ||
    team?.code.toLowerCase() === championLower
  );
}

function findChampionMatchInRound(
  pairs: WinnerPredictionMatchPair[],
  championTeam: string
): WinnerPredictionMatchPair | undefined {
  return pairs.find((pair) =>
    pair.teams.some((team) => teamMatchesChampion(team, championTeam))
  );
}

export function formatPredictionRecordPath(
  prediction: WinnerPredictionPayload
): string {
  const championCode =
    resolveTeamCode(prediction.champion_team) ||
    prediction.champion_team.toUpperCase();
  const segments: string[] = [];

  for (const roundPairs of [
    prediction.round_16_teams,
    prediction.round_8_teams,
    prediction.round_4_teams,
    prediction.final_teams,
  ]) {
    const matchPair = findChampionMatchInRound(
      roundPairs,
      prediction.champion_team
    );

    if (!matchPair) {
      continue;
    }

    const codes = matchPair.teams.map((team) => resolveTeamCode(team));
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

export function formatJoinedHistoryTimestamp(
  createTime: string,
  locale: string
): string {
  const date = new Date(createTime);

  if (Number.isNaN(date.getTime())) {
    return createTime;
  }

  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${timeFormatter.format(date)} · ${dateFormatter.format(date)}`;
}
