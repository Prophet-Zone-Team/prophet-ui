import type { MarketDataMeta } from "@/data/providers/types";
import type { TeamMarketSnapshot, WorldCupMatch } from "@/types/market";
import { TracksPanel } from "@/views/tracks/tracks-panel";

export interface TracksViewProps {
  snapshots: TeamMarketSnapshot[];
  matches: WorldCupMatch[];
  dataStatus: MarketDataMeta;
}

export function TracksView({ snapshots, matches, dataStatus }: TracksViewProps) {
  return (
    <section className="mx-auto max-w-[1112px] px-4 py-8">
      <TracksPanel
        snapshots={snapshots}
        matches={matches}
        dataStatus={dataStatus}
      />
    </section>
  );
}
