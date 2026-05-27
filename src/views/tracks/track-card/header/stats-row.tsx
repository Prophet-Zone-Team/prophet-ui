import { formatVolume } from "@/components/home/market-formatters";

import type { TrackCardYouBid } from "../types";
import { ProbabilityStat, VolumeStat } from "./probability-stat";
import { YouBidStat } from "./you-bid-stat";

export type TeamStatsRowProps = {
  probability: number;
  change24h: number;
  volume: number;
  youBid?: TrackCardYouBid;
};

export type GameStatsRowProps = {
  probability: number;
  probabilityTeamCode: string;
  volume: number;
  youBid?: TrackCardYouBid;
};

export function TeamStatsRow({
  probability,
  change24h,
  volume,
  youBid
}: TeamStatsRowProps) {
  return (
    <div className="w-[37%] flex shrink-0 items-end gap-[50px]">
      <ProbabilityStat probability={probability} change24h={change24h} />
      <VolumeStat volumeLabel={`$${formatVolume(volume)}`} />
      <YouBidStat
        amountLabel={youBid?.amountLabel ?? "$0"}
        outcomeSide={youBid?.outcomeSide}
      />
    </div>
  );
}

export function GameStatsRow({
  probability,
  probabilityTeamCode,
  volume,
  youBid
}: GameStatsRowProps) {
  return (
    <div className="w-[37%] flex shrink-0 items-end gap-[50px]">
      <ProbabilityStat
        probability={probability}
        change24h={0}
        teamCode={probabilityTeamCode}
      />
      <VolumeStat volumeLabel={`$${formatVolume(volume)}`} />
      <YouBidStat amountLabel={youBid?.amountLabel ?? "$0"} />
    </div>
  );
}
