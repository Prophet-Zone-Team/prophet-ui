import { getWorldCupTeamByIdOrCode } from "@/data/world-cup-2026/groups";
import type { PathResult, RoundOpponentSummary } from "@/types/market";

import type {
  RoadToFinalBracket,
  RoadToFinalSlot,
  RoadToFinalTeam
} from "./types";

const KNOCKOUT_ROUND_MATCH_IDS = {
  r16: [89, 90, 91, 92, 93, 94, 95, 96],
  qf: [97, 98, 99, 100],
  sf: [101, 102],
  final: [104]
} as const;

const STRONG_OPPONENT_NAMES = [
  "France",
  "Argentina",
  "England",
  "Spain",
  "Germany",
  "Brazil"
];

const ROUND_KEY_BY_KNOCKOUT: Partial<
  Record<
    PathResult["rounds"][number]["round"],
    keyof typeof KNOCKOUT_ROUND_MATCH_IDS
  >
> = {
  R16: "r16",
  QF: "qf",
  SF: "sf",
  FINAL: "final"
};

function emptyBracket(): RoadToFinalBracket {
  return {
    r16: Array.from({ length: 16 }, () => null),
    qf: Array.from({ length: 8 }, () => null),
    sf: Array.from({ length: 4 }, () => null),
    final: Array.from({ length: 2 }, () => null)
  };
}

function toRoadTeam(
  teamId: string,
  teamCode: string,
  teamName: string
): RoadToFinalTeam {
  return { id: teamId, teamCode, teamName };
}

function toRoadTeamFromId(teamId: string): RoadToFinalTeam | null {
  const team = getWorldCupTeamByIdOrCode(teamId);

  if (!team) {
    return null;
  }

  return toRoadTeam(team.id, team.code, team.name);
}

function pickFeaturedOpponent(
  round: RoundOpponentSummary
): RoadToFinalTeam | null {
  const featured =
    round.possibleOpponentTeams.find((team) =>
      STRONG_OPPONENT_NAMES.includes(team.teamName)
    ) ?? round.possibleOpponentTeams[0];

  return featured ? toRoadTeamFromId(featured.teamId) : null;
}

function setMatchPair(
  slots: RoadToFinalSlot[],
  matchIndex: number,
  team: RoadToFinalTeam,
  opponent: RoadToFinalTeam | null
) {
  const baseIndex = matchIndex * 2;

  slots[baseIndex] = team;

  if (opponent) {
    slots[baseIndex + 1] = opponent;
  }
}

export function buildRoadToFinalBracket(
  result: PathResult
): RoadToFinalBracket {
  const bracket = emptyBracket();
  const selectedTeam = toRoadTeam(
    result.teamId,
    result.teamCode,
    result.teamName
  );

  for (const roundSummary of result.rounds) {
    const roundKey = ROUND_KEY_BY_KNOCKOUT[roundSummary.round];

    if (!roundKey) {
      continue;
    }

    const matchIds: number[] = [...KNOCKOUT_ROUND_MATCH_IDS[roundKey]];
    const pathMatchId =
      roundSummary.matchIds.find((matchId) =>
        result.pathMatchIds.includes(matchId)
      ) ?? roundSummary.matchIds[0];
    const matchIndex =
      pathMatchId !== undefined ? matchIds.indexOf(pathMatchId) : -1;

    if (matchIndex < 0) {
      continue;
    }

    setMatchPair(
      bracket[roundKey],
      matchIndex,
      selectedTeam,
      pickFeaturedOpponent(roundSummary)
    );
  }

  return bracket;
}
