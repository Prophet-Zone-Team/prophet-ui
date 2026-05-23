"use client";

import { buildGameBidOrderPreview, getDefaultGameLimitPrice } from "@/lib/market/game-order";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import type { GameMarketSnapshot, MatchOutcomeSide } from "@/types/market";
import { GameBuyPanel } from "@/views/trade/game/game-buy-panel";
import { gameSimpleCardClass } from "@/views/trade/game/simple/game-simple-ui";

const DEFAULT_BID_AMOUNT = 100;

export interface GameSimpleBuySheetProps {
  snapshot: GameMarketSnapshot;
  outcomeSide: MatchOutcomeSide;
  onClose: () => void;
}

export function GameSimpleBuySheet({
  snapshot,
  outcomeSide,
  onClose
}: GameSimpleBuySheetProps) {
  const outcome = snapshot.outcomes.find((item) => item.side === outcomeSide);

  return (
    <div className={`${gameSimpleCardClass} overflow-hidden`}>
      <div className="flex items-center justify-between border-b border-[#EBEBEB] px-4 py-3">
        <span className="text-base font-[556] text-black">
          {outcome?.label ?? "Order preview"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="border-0 bg-transparent text-sm font-[556] text-[#909090] hover:text-black"
        >
          Close
        </button>
      </div>
      <GameBuyPanel
        snapshot={snapshot}
        outcomeSide={outcomeSide}
        onOutcomeSideChange={() => undefined}
        hideOutcomeSelector
      />
    </div>
  );
}

export function getGameSimpleBidPrice(
  snapshot: GameMarketSnapshot,
  side: MatchOutcomeSide
): number {
  const preview = buildGameBidOrderPreview({
    snapshot,
    outcomeSide: side,
    tradeSide: "buy",
    amount: DEFAULT_BID_AMOUNT,
    limitPrice: getDefaultGameLimitPrice(snapshot, side),
    orderType: "FAK"
  });

  return preview.estimatedTotalCost;
}

export function formatSimpleBidLabel(amount: number): string {
  return `Bid $${amount.toFixed(1)}`;
}

export function getSimpleOutcomeLabels(
  snapshot: GameMarketSnapshot,
  teamSnapshots: Parameters<typeof resolveMatchSides>[1]
) {
  const sides = resolveMatchSides(snapshot.match, teamSnapshots);

  return {
    home: sides.home.name,
    draw: "Draw",
    away: sides.away.name
  };
}
