import type {
  MarketDataMeta,
  WorldCupMarketData
} from "@/data/providers/types";
import type {
  ProbabilityHistoryPoint,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import { HomeHero } from "@/views/home/header";
import { HomeTabPanels } from "@/views/home/home-tab-panels";
import { HomeMatchesPanel } from "@/views/home/matches";
import { HomeWinnerPanel } from "@/views/home/winner";
import { getRelativeChangePercent } from "@/components/home/market-formatters";

export interface HomeViewProps {
  snapshots: TeamMarketSnapshot[];
  matches: WorldCupMatch[];
  dataStatus: MarketDataMeta;
  probabilityHistory: ProbabilityHistoryPoint[];
  universe?: WorldCupMarketData["universe"];
}

export function HomeView({
  snapshots,
  matches,
  dataStatus,
  probabilityHistory,
  universe
}: HomeViewProps) {
  const teams = [...snapshots].sort(
    (a, b) => b.market.probability - a.market.probability
  );
  const totalVolume =
    universe?.totalVolume ??
    teams.reduce((sum, snapshot) => sum + snapshot.market.volume, 0);
  const topMove = [...teams].sort((a, b) => {
    return (
      Math.abs(
        getRelativeChangePercent(b.market.probability, b.market.change24h)
      ) -
      Math.abs(
        getRelativeChangePercent(a.market.probability, a.market.change24h)
      )
    );
  })[0];

  return (
    <section className="max-w-[1112px] mx-auto">
      <HomeHero
        teamCount={teams.length}
        totalVolume={totalVolume}
        topMove={topMove}
        dataSource={dataStatus.source}
      />

      <HomeTabPanels
        winner={
          <HomeWinnerPanel
            teams={teams}
            dataStatus={dataStatus}
            probabilityHistory={probabilityHistory}
          />
        }
        matches={<HomeMatchesPanel matches={matches} snapshots={teams} />}
      />
    </section>
  );
}
