import type { CuratedTeamEntry } from "@/data/teams/curated-team-list";
import { STRATEGY_DATA } from "@/data/strategy";
import type { TeamMarketSnapshot } from "@/types/market";
import type { PortfolioStrategyRecord } from "@/views/portfolio/strategy/types";
import {
  buildAvailableStrategyCards,
  type AvailableStrategyCardData
} from "@/views/strategy/lib/map-strategy-data";

function normalizeTeamName(name: string): string {
  return name.trim().toLowerCase();
}

function teamsMatchStrategy(
  legTeamNames: string[],
  strategyTeams: CuratedTeamEntry[]
): boolean {
  if (legTeamNames.length !== strategyTeams.length) {
    return false;
  }

  const strategyNames = new Set(
    strategyTeams.map((team) => normalizeTeamName(team.name))
  );

  return legTeamNames.every((name) =>
    strategyNames.has(normalizeTeamName(name))
  );
}

export function findPortfolioStrategyTemplateId(
  record: PortfolioStrategyRecord
): string | null {
  const legTeamNames = record.legs
    .map((leg) => leg.team.name?.trim() ?? "")
    .filter((name) => name.length > 0);

  if (legTeamNames.length > 0) {
    const teamMatch = Object.entries(STRATEGY_DATA).find(([, entry]) =>
      teamsMatchStrategy(legTeamNames, entry.teams)
    );

    if (teamMatch) {
      return teamMatch[0];
    }
  }

  const normalizedRecordName = normalizeTeamName(record.name);
  const nameMatch = Object.entries(STRATEGY_DATA).find(
    ([, entry]) => normalizeTeamName(entry.name) === normalizedRecordName
  );

  return nameMatch ? nameMatch[0] : null;
}

export function canPortfolioStrategyBidAgain(
  record: PortfolioStrategyRecord
): boolean {
  return (
    record.status !== "hit_succeed" &&
    record.status !== "hit_missed" &&
    findPortfolioStrategyTemplateId(record) !== null
  );
}

export function resolveAvailableStrategyForPortfolio(
  record: PortfolioStrategyRecord,
  snapshots: TeamMarketSnapshot[]
): AvailableStrategyCardData | null {
  const templateId = findPortfolioStrategyTemplateId(record);

  if (!templateId) {
    return null;
  }

  const cards = buildAvailableStrategyCards(snapshots);

  return cards.find((card) => card.id === templateId) ?? null;
}
