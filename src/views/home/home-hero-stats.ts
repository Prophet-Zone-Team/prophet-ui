import type {
  MarketDataMeta,
  WorldCupMarketData
} from "@/data/providers/types";
import type { TeamMarketSnapshot } from "@/types/market";

export interface HomeHeroStats {
  teams: TeamMarketSnapshot[];
  totalVolume: number;
  topMove?: TeamMarketSnapshot;
  dataSource: MarketDataMeta["source"];
}

export function sortHomeTeams(
  snapshots: TeamMarketSnapshot[]
): TeamMarketSnapshot[] {
  return [...snapshots].sort(
    (a, b) => b.market.probability - a.market.probability
  );
}

export function computeHomeHeroStats(
  snapshots: TeamMarketSnapshot[],
  dataStatus: MarketDataMeta,
  universe?: WorldCupMarketData["universe"]
): HomeHeroStats {
  const teams = sortHomeTeams(snapshots);
  const totalVolume =
    universe?.totalVolume ??
    teams.reduce((sum, snapshot) => sum + snapshot.market.volume, 0);

  const topMove = [...snapshots].sort((a, b) => {
    return Math.abs(b.market.change24h) - Math.abs(a.market.change24h);
  })[0];

  return {
    teams,
    totalVolume,
    topMove,
    dataSource: dataStatus.source
  };
}
