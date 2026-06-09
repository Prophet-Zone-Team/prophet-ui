import {
  findCuratedEntryByName,
  findCuratedTeamByName,
  type CuratedTeamEntry
} from "@/data/teams/curated-team-list";
import {
  calculateHitReturnLabel,
  computeStrategyAllocation,
  formatStrategyRoiPercent
} from "@/lib/strategy/strategy-metrics";
import type { TeamMarketSnapshot } from "@/types/market";
import type {
  PortfolioStrategyLeg,
  PortfolioStrategyRecord
} from "@/views/portfolio/strategy/types";

function syntheticCuratedEntry(name: string): CuratedTeamEntry {
  const trimmed = name.trim() || "—";

  return {
    name: trimmed,
    logo: "",
    abbreviation: trimmed.slice(0, 3).toUpperCase(),
    continent: "",
    started: false,
    eliminated: false
  };
}

function resolveLegCuratedTeam(leg: PortfolioStrategyLeg): CuratedTeamEntry {
  const name = leg.team.name?.trim() ?? "";

  return findCuratedEntryByName(name) ?? syntheticCuratedEntry(name);
}

function buildSnapshotByTeamId(
  snapshots: TeamMarketSnapshot[]
): Map<string, TeamMarketSnapshot> {
  return new Map(snapshots.map((snapshot) => [snapshot.team.id, snapshot]));
}

function resolveTeamProbability(
  team: CuratedTeamEntry,
  snapshotByTeamId: Map<string, TeamMarketSnapshot>
): number | undefined {
  const curatedTeam = findCuratedTeamByName(team.name);

  if (!curatedTeam) {
    return undefined;
  }

  return snapshotByTeamId.get(curatedTeam.id)?.market.probability;
}

export function enrichPortfolioStrategyRecord(
  record: PortfolioStrategyRecord,
  snapshots: TeamMarketSnapshot[]
): PortfolioStrategyRecord {
  if (record.legs.length === 0) {
    return record;
  }

  const totalTraded = record.legs.reduce(
    (sum, leg) => sum + leg.tradedAmount,
    0
  );
  const totalValue = record.legs.reduce(
    (sum, leg) => sum + leg.currentValue,
    0
  );

  let roiLabel = record.roiLabel;

  if (totalTraded > 0) {
    roiLabel = formatStrategyRoiPercent(
      (totalValue - totalTraded) / totalTraded
    );
  }

  let hitReturnLabel = record.hitReturnLabel;

  if (totalTraded > 0 && snapshots.length > 0) {
    const curatedTeams = record.legs.map(resolveLegCuratedTeam);
    const snapshotByTeamId = buildSnapshotByTeamId(snapshots);
    const probabilities = curatedTeams.map((team) =>
      resolveTeamProbability(team, snapshotByTeamId)
    );
    const allocation = computeStrategyAllocation({
      budget: totalTraded,
      teams: curatedTeams,
      probabilities
    });

    if (allocation) {
      const liveHitReturn = calculateHitReturnLabel({
        budget: totalTraded,
        teams: curatedTeams,
        probabilities
      });

      if (liveHitReturn !== "—") {
        hitReturnLabel = liveHitReturn;
      }
    }
  }

  return {
    ...record,
    value: totalValue,
    roiLabel,
    hitReturnLabel
  };
}

export function enrichPortfolioStrategyRecords(
  records: PortfolioStrategyRecord[],
  snapshots: TeamMarketSnapshot[]
): PortfolioStrategyRecord[] {
  return records.map((record) =>
    enrichPortfolioStrategyRecord(record, snapshots)
  );
}
