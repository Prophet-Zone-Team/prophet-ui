import type { CuratedTeamEntry } from "@/data/teams/curated-team-list";

import teams from "../teams";

export type StrategyDataEntry = {
  name: string;
  teams: CuratedTeamEntry[];
  description: string;
  budget: number;
};

export const STRATEGY_DATA: Record<string, StrategyDataEntry> = {
  "south-american": {
    name: "South American team combination",
    description:
      "Covers five South American sides with the strongest winner-market liquidity in the region.",
    budget: 1000,
    teams: [
      teams["Brazil"],
      teams["Argentina"],
      teams["Colombia"],
      teams["Uruguay"],
      teams["Ecuador"]
    ]
  },
  european: {
    name: "European powerhouse combination",
    description:
      "Spreads exposure across eight European contenders with elevated combined winner probability.",
    budget: 1000,
    teams: [
      teams["Spain"],
      teams["France"],
      teams["England"],
      teams["Portugal"],
      teams["Germany"],
      teams["Netherlands"],
      teams["Norway"],
      teams["Belgium"]
    ]
  },
  "medium-risk": {
    name: "Medium-risk combination",
    description:
      "Mixes top-tier favorites with secondary contenders to balance coverage and estimated upside.",
    budget: 1000,
    teams: [
      teams["Portugal"],
      teams["Brazil"],
      teams["Argentina"],
      teams["Germany"],
      teams["Netherlands"],
      teams["Japan"],
      teams["Belgium"],
      teams["Colombia"]
    ]
  },
  "low-risk": {
    name: "Stable coverage baseline",
    description:
      "Prioritizes historically strong winner markets with tighter probability dispersion.",
    budget: 1000,
    teams: [
      teams["Spain"],
      teams["France"],
      teams["England"],
      teams["Portugal"],
      teams["Brazil"],
      teams["Argentina"],
      teams["Germany"]
    ]
  },
  "cross-continental": {
    name: "No New Champion Basket",
    description:
      "Backs every available former World Cup winner, betting that the 2026 champion will come from football’s historic elite rather than a first-time winner.",
    budget: 1000,
    teams: [
      teams["Spain"],
      teams["France"],
      teams["England"],
      teams["Brazil"],
      teams["Argentina"],
      teams["Germany"],
      teams["Uruguay"]
    ]
  }
};

/** Set when the tournament winner is known; unset to hide ended strategies. */
export const WINNER: CuratedTeamEntry | null = null;

export function getTournamentWinner(): CuratedTeamEntry | null {
  return WINNER;
}

export function hasTournamentWinner(): boolean {
  return WINNER !== null;
}
