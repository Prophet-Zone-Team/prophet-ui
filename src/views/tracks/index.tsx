import type { MarketDataMeta } from "../../data/providers/types";
import type { TeamMarketSnapshot, WorldCupMatch } from "../../types/market";
import { TracksPanel } from "./TracksPanel";

export interface TracksViewProps {
  snapshots: TeamMarketSnapshot[];
  matches: WorldCupMatch[];
  dataStatus: MarketDataMeta;
}

export function TracksView({ snapshots, matches, dataStatus }: TracksViewProps) {
  return (
    <section className="mx-auto max-w-[1112px] px-4 py-8">
      <header className="mb-6">
        <p className="m-0 text-xs font-normal uppercase tracking-[0.16em] text-[#667188]">
          Track
        </p>
        <h1 className="m-0 mt-1 text-2xl font-[556] leading-[29px] text-black">
          Tracked teams and matches
        </h1>
        <p className="m-0 mt-2 max-w-2xl text-sm leading-[17px] text-[#667188]">
          Teams and matches you subscribe from the market list or schedule appear
          here with the same market context.
        </p>
      </header>

      <TracksPanel
        snapshots={snapshots}
        matches={matches}
        dataStatus={dataStatus}
      />
    </section>
  );
}
