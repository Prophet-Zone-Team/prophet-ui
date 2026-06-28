import { KNOCKOUT_LINKS } from "@/data/world-cup-2026/knockout-links";
import { ROUND_OF_32 } from "@/data/world-cup-2026/round-of-32";
import type { ThirdPlaceWinnerSeed } from "@/data/world-cup-2026/third-place-options";

import type { BracketColumnConfig, BracketMatchConfig } from "../types";

export const LEFT_BRACKET_COLUMNS: BracketColumnConfig[] = [
  { key: "r32", label: "Round of 32", matchIds: [74, 77, 73, 75, 83, 84, 81, 82] },
  { key: "r16", label: "Round of 16", matchIds: [89, 90, 93, 94] },
  { key: "qf", label: "Quarterfinal", matchIds: [97, 98] },
  { key: "sf", label: "Semifinal", matchIds: [101] }
];

export const RIGHT_BRACKET_COLUMNS: BracketColumnConfig[] = [
  { key: "sf", label: "Semifinal", matchIds: [102] },
  { key: "qf", label: "Quarterfinal", matchIds: [99, 100] },
  { key: "r16", label: "Round of 16", matchIds: [91, 92, 95, 96] },
  { key: "r32", label: "Round of 32", matchIds: [76, 78, 79, 80, 86, 88, 85, 87] }
];

export const THIRD_PLACE_WINNER_SEEDS: readonly ThirdPlaceWinnerSeed[] = [
  "1A",
  "1B",
  "1D",
  "1E",
  "1G",
  "1I",
  "1K",
  "1L"
];

export const MATCH_LOOKUP: Map<number, BracketMatchConfig> = new Map(
  [
    ...ROUND_OF_32.map(
      (match): BracketMatchConfig => ({ ...match, stage: "R32" })
    ),
    ...KNOCKOUT_LINKS
  ].map((match): [number, BracketMatchConfig] => [match.matchId, match])
);

function buildDownstreamMatchMap(): Map<number, number[]> {
  const map = new Map<number, number[]>();

  for (const match of KNOCKOUT_LINKS) {
    for (const seed of [match.left, match.right]) {
      const sourceMatch = seed.match(/^W(\d+)$/);

      if (!sourceMatch) {
        continue;
      }

      const sourceMatchId = Number(sourceMatch[1]);
      map.set(sourceMatchId, [...(map.get(sourceMatchId) ?? []), match.matchId]);
    }
  }

  return map;
}

export const DOWNSTREAM_MATCHES_BY_SOURCE = buildDownstreamMatchMap();

export function collectDownstreamMatchIds(matchId: number): number[] {
  const directMatches = DOWNSTREAM_MATCHES_BY_SOURCE.get(matchId) ?? [];
  const downstream = new Set<number>();
  const queue = [...directMatches];

  while (queue.length) {
    const nextMatchId = queue.shift();

    if (!nextMatchId || downstream.has(nextMatchId)) {
      continue;
    }

    downstream.add(nextMatchId);
    queue.push(...(DOWNSTREAM_MATCHES_BY_SOURCE.get(nextMatchId) ?? []));
  }

  return [...downstream];
}

export function updateKnockoutWinner(
  current: Record<number, string>,
  matchId: number,
  nextTeamId: string
): Record<number, string> {
  const next = { ...current, [matchId]: nextTeamId };

  if (!nextTeamId) {
    delete next[matchId];
  }

  for (const downstreamMatchId of collectDownstreamMatchIds(matchId)) {
    delete next[downstreamMatchId];
  }

  return next;
}
