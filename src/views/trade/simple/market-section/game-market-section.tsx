"use client";

import { resolveMatchSides } from "@/lib/market/schedule-match";
import type { GameMarketSnapshot, TeamMarketSnapshot } from "@/types/market";
import {
  useSetTradeMatchOutcomeSide,
  useTradeMatchOutcomeSide
} from "@/store/trade-ticket-store";
import { simpleGameColors } from "@/views/trade/simple/ui";
import {
  formatChangePillLabel,
  formatGameMatchBidLabel,
  getGameSimpleSidePrice
} from "@/views/trade/simple/market-section/format-bid-label";
import {
  BidButton,
  ChangePill,
  ProbabilityBar
} from "@/views/trade/simple/market-section/shared";

export interface GameMarketSectionProps {
  snapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
}

function getOutcomeProbability(
  snapshot: GameMarketSnapshot,
  side: "home" | "draw" | "away"
): number {
  return snapshot.outcomes.find((item) => item.side === side)?.probability ?? 0;
}

function getOutcomeChange(
  snapshot: GameMarketSnapshot,
  side: "home" | "draw" | "away"
): number | undefined {
  return snapshot.outcomes.find((item) => item.side === side)?.change24h;
}

export function GameMarketSection({
  snapshot,
  teamSnapshots
}: GameMarketSectionProps) {
  const matchOutcomeSide = useTradeMatchOutcomeSide();
  const setMatchOutcomeSide = useSetTradeMatchOutcomeSide();
  const sides = resolveMatchSides(snapshot.match, teamSnapshots);
  const homeProb = getOutcomeProbability(snapshot, "home");
  const drawProb = getOutcomeProbability(snapshot, "draw");
  const awayProb = getOutcomeProbability(snapshot, "away");

  const homeChange = formatChangePillLabel(getOutcomeChange(snapshot, "home"));
  const drawChange = formatChangePillLabel(getOutcomeChange(snapshot, "draw"));
  const awayChange = formatChangePillLabel(getOutcomeChange(snapshot, "away"));

  const homePrice = getGameSimpleSidePrice(snapshot, "home");
  const drawPrice = getGameSimpleSidePrice(snapshot, "draw");
  const awayPrice = getGameSimpleSidePrice(snapshot, "away");
  const homeBidLabel = sides.home.code ?? sides.home.name.slice(0, 3).toUpperCase();
  const awayBidLabel = sides.away.code ?? sides.away.name.slice(0, 3).toUpperCase();

  return (
    <section className="flex flex-col gap-5 py-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 text-black">
        <p className="text-[60px] font-[556] capitalize leading-[72px]">
          {Math.round(homeProb)}%
        </p>
        <p className="text-xl font-[556] capitalize leading-6">
          {Math.round(drawProb)}%
        </p>
        <p className="text-right text-[60px] font-[556] capitalize leading-[72px]">
          {Math.round(awayProb)}%
        </p>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-xl font-[556] capitalize leading-6 text-black">
            {sides.home.name}
          </p>
          {homeChange ? (
            <ChangePill label={homeChange} color={simpleGameColors.home} />
          ) : null}
        </div>

        <div className="flex items-center justify-center gap-2">
          {drawChange ? (
            <ChangePill label={drawChange} color={simpleGameColors.draw} />
          ) : null}
          <p className="text-xl font-[556] capitalize leading-6 text-black">
            Draw
          </p>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2">
          {awayChange ? (
            <ChangePill label={awayChange} color={simpleGameColors.awayBar} />
          ) : null}
          <p className="truncate text-right text-xl font-[556] capitalize leading-6 text-black">
            {sides.away.name}
          </p>
        </div>
      </div>

      <ProbabilityBar
        trackColor={simpleGameColors.drawBar}
        segments={[
          { value: homeProb, color: simpleGameColors.home },
          { value: drawProb, color: simpleGameColors.draw },
          { value: awayProb, color: simpleGameColors.awayBar }
        ]}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <BidButton
          label={formatGameMatchBidLabel(homeBidLabel, homePrice)}
          background={simpleGameColors.home}
          active={matchOutcomeSide === "home"}
          onClick={() => setMatchOutcomeSide("home")}
        />
        <BidButton
          label={formatGameMatchBidLabel("Draw", drawPrice)}
          background={simpleGameColors.draw}
          active={matchOutcomeSide === "draw"}
          onClick={() => setMatchOutcomeSide("draw")}
        />
        <BidButton
          label={formatGameMatchBidLabel(awayBidLabel, awayPrice)}
          background={simpleGameColors.awayBar}
          active={matchOutcomeSide === "away"}
          onClick={() => setMatchOutcomeSide("away")}
        />
      </div>
    </section>
  );
}
