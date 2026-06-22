import { MATCH_LOOKUP } from "./bracket-config";
import type { KnockoutWinners } from "../types";

export type ChampionPathHighlight = {
  highlightedMatchIds: Set<number>;
  highlightedTeamIds: Set<string>;
  highlightedConnectorKeys: Set<string>;
};

const FINAL_MATCH_ID = 104;

function findFeederMatchIds(matchId: number): number[] {
  const match = MATCH_LOOKUP.get(matchId);

  if (!match) {
    return [];
  }

  const feeders: number[] = [];

  for (const seed of [match.left, match.right]) {
    const winnerRef = seed.match(/^W(\d+)$/);

    if (winnerRef) {
      feeders.push(Number(winnerRef[1]));
    }
  }

  return feeders;
}

function connectorKey(
  sourceMatchId: number,
  targetMatchId: number
): string | undefined {
  const sourceStage = MATCH_LOOKUP.get(sourceMatchId)?.stage;
  const targetStage = MATCH_LOOKUP.get(targetMatchId)?.stage;

  if (sourceStage === "R32" && targetStage === "R16") {
    return `r32-r16:${sourceMatchId}->${targetMatchId}`;
  }

  if (sourceStage === "R16" && targetStage === "QF") {
    return `r16-qf:${sourceMatchId}->${targetMatchId}`;
  }

  if (sourceStage === "QF" && targetStage === "SF") {
    return `qf-sf:${sourceMatchId}->${targetMatchId}`;
  }

  if (sourceStage === "SF" && targetMatchId === FINAL_MATCH_ID) {
    return `sf-final:${sourceMatchId}->${FINAL_MATCH_ID}`;
  }

  return undefined;
}

export function buildChampionPathHighlight(
  knockoutWinners: KnockoutWinners,
  championTeamId?: string
): ChampionPathHighlight {
  const championId =
    championTeamId ?? knockoutWinners[FINAL_MATCH_ID] ?? undefined;

  if (!championId) {
    return {
      highlightedMatchIds: new Set(),
      highlightedTeamIds: new Set(),
      highlightedConnectorKeys: new Set()
    };
  }

  const highlightedMatchIds = new Set<number>();
  const highlightedTeamIds = new Set<string>([championId]);
  const highlightedConnectorKeys = new Set<string>();

  let currentMatchId: number | undefined = FINAL_MATCH_ID;

  while (currentMatchId !== undefined) {
    highlightedMatchIds.add(currentMatchId);

    const winnerId = knockoutWinners[currentMatchId];

    if (winnerId) {
      highlightedTeamIds.add(winnerId);
    }

    const feeders = findFeederMatchIds(currentMatchId);
    const feederOnPath = feeders.find(
      (feederId) => knockoutWinners[feederId] === championId
    );

    if (feederOnPath === undefined) {
      break;
    }

    const key = connectorKey(feederOnPath, currentMatchId);

    if (key) {
      highlightedConnectorKeys.add(key);
    }

    currentMatchId = feederOnPath;
  }

  return {
    highlightedMatchIds,
    highlightedTeamIds,
    highlightedConnectorKeys
  };
}
