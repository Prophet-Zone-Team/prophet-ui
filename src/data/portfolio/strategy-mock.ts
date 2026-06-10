import teams from "@/data/teams";
import type { CuratedTeamEntry } from "@/data/teams/curated-team-list";
import { STRATEGY_DATA } from "@/data/strategy";
import { getPortfolioStrategyStatusDisplayFromCurated } from "@/lib/strategy/portfolio-strategy-status";
import { mapCuratedTeamToRef } from "@/views/strategy/lib/map-strategy-data";
import type { PortfolioStrategyRecord } from "@/views/portfolio/strategy/types";

const TRADED_AT = "2026-05-22T12:49:00.000Z";

function legFromTeam(
  id: string,
  team: CuratedTeamEntry,
  marketTitle: string,
  tradedAmount: number,
  toWinAmount: number,
  cashPnl: number,
  percentPnl: number,
  tradedAt: string = TRADED_AT,
  currentValue: number = tradedAmount
) {
  return {
    id,
    team: mapCuratedTeamToRef(team),
    marketTitle,
    side: "yes" as const,
    tradedAmount,
    toWinAmount,
    currentValue,
    cashPnl,
    percentPnl,
    tradedAt
  };
}

function buildPortfolioStrategyRecord(
  id: string,
  overrides: Omit<PortfolioStrategyRecord, "id" | "status" | "statusLabel"> & {
    legs: ReturnType<typeof legFromTeam>[];
  }
): PortfolioStrategyRecord {
  const strategyTeams = STRATEGY_DATA[id]?.teams ?? [];
  const { status, label } =
    getPortfolioStrategyStatusDisplayFromCurated(strategyTeams);

  return {
    id,
    status,
    statusLabel: label,
    ...overrides
  };
}
