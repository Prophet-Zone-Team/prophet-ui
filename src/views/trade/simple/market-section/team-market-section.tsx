"use client";

import type { TeamMarketSnapshot } from "@/types/market";
import {
  useSetTradeOutcomeSide,
  useTradeOutcomeSide
} from "@/store/trade-ticket-store";
import { simpleTeamColors } from "@/views/trade/simple/ui";
import {
  formatChangePillLabel,
  formatSimpleOutcomeBidLabel,
  getTeamSimpleSidePrice
} from "@/views/trade/simple/market-section/format-bid-label";
import {
  BidButton,
  ChangePill,
  ProbabilityBar
} from "@/views/trade/simple/market-section/shared";

export interface TeamMarketSectionProps {
  snapshot: TeamMarketSnapshot;
}

export function TeamMarketSection({ snapshot }: TeamMarketSectionProps) {
  const outcomeSide = useTradeOutcomeSide();
  const setOutcomeSide = useSetTradeOutcomeSide();
  const yesProb = snapshot.market.probability;
  const noProb = Math.max(0, 100 - yesProb);
  const yesChange = formatChangePillLabel(snapshot.market.change24h);
  const noChange = formatChangePillLabel(-snapshot.market.change24h);
  const yesPrice = getTeamSimpleSidePrice(snapshot, "yes");
  const noPrice = getTeamSimpleSidePrice(snapshot, "no");

  return (
    <section className="flex flex-col gap-5 pt-[60px] pb-[20px]">
      <div className="grid grid-cols-2 items-end gap-3 text-black">
        <p className="text-[60px] font-[556] capitalize leading-[72px]">
          {Math.round(yesProb)}%
        </p>
        <p className="text-right text-[60px] font-[556] capitalize leading-[72px]">
          {Math.round(noProb)}%
        </p>
      </div>

      <div className="grid grid-cols-2 items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {yesChange ? (
            <ChangePill label={yesChange} color={simpleTeamColors.yes} />
          ) : null}
          <p className="truncate text-xl font-[556] capitalize leading-6 text-black">
            Yes
          </p>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2">
          {noChange ? (
            <ChangePill label={noChange} color={simpleTeamColors.no} />
          ) : null}
          <p className="truncate text-right text-xl font-[556] capitalize leading-6 text-black">
            No
          </p>
        </div>
      </div>

      <ProbabilityBar
        trackColor={simpleTeamColors.barTrack}
        segments={[
          { value: yesProb, color: simpleTeamColors.yes },
          { value: noProb, color: simpleTeamColors.no }
        ]}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <BidButton
          label={formatSimpleOutcomeBidLabel("yes", yesPrice)}
          background={simpleTeamColors.yes}
          active={outcomeSide === "yes"}
          onClick={() => setOutcomeSide("yes")}
        />
        <BidButton
          label={formatSimpleOutcomeBidLabel("no", noPrice)}
          background={simpleTeamColors.no}
          active={outcomeSide === "no"}
          onClick={() => setOutcomeSide("no")}
        />
      </div>
    </section>
  );
}
