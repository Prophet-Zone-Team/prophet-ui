"use client";

import { cn } from "@/lib/cn";
import { formatTradePanelPrice } from "@/lib/market/order-math";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import {
  useSetTradeMatchOutcomeSide,
  useTradeMatchOutcomeSide
} from "@/store/trade-ticket-store";
import type { GameMarketSnapshot, TeamMarketSnapshot } from "@/types/market";
import { getGameSimpleSidePrice } from "@/views/trade/simple/market-section/format-bid-label";
import { simpleGameColors } from "@/views/trade/simple/ui";

export interface GameOutcomeBidButtonsProps {
  gameSnapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
}

function GameOutcomeBidButton({
  title,
  price,
  background,
  active = false,
  onClick
}: {
  title: string;
  price: number;
  background: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-[12px] border-0 font-[556] text-white transition-opacity",
        onClick ? "cursor-pointer" : "cursor-default",
        active ? "opacity-100" : "opacity-70 hover:opacity-85"
      )}
      style={{ backgroundColor: background }}
    >
      <span className="text-sm leading-[17px]">{title}</span>
      <span className="text-xs leading-[14px]">
        {formatTradePanelPrice(price)}
      </span>
    </button>
  );
}

export function GameOutcomeBidButtons({
  gameSnapshot,
  teamSnapshots
}: GameOutcomeBidButtonsProps) {
  const matchOutcomeSide = useTradeMatchOutcomeSide();
  const setMatchOutcomeSide = useSetTradeMatchOutcomeSide();
  const sides = resolveMatchSides(gameSnapshot.match, teamSnapshots);

  const homePrice = getGameSimpleSidePrice(gameSnapshot, "home");
  const drawPrice = getGameSimpleSidePrice(gameSnapshot, "draw");
  const awayPrice = getGameSimpleSidePrice(gameSnapshot, "away");
  const homeBidLabel =
    sides.home.code ?? sides.home.name.slice(0, 3).toUpperCase();
  const awayBidLabel =
    sides.away.code ?? sides.away.name.slice(0, 3).toUpperCase();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <GameOutcomeBidButton
        title={homeBidLabel}
        price={homePrice}
        background={simpleGameColors.home}
        active={matchOutcomeSide === "home"}
        onClick={() => setMatchOutcomeSide("home")}
      />
      <GameOutcomeBidButton
        title="Draw"
        price={drawPrice}
        background={simpleGameColors.draw}
        active={matchOutcomeSide === "draw"}
        onClick={() => setMatchOutcomeSide("draw")}
      />
      <GameOutcomeBidButton
        title={awayBidLabel}
        price={awayPrice}
        background={simpleGameColors.awayBar}
        active={matchOutcomeSide === "away"}
        onClick={() => setMatchOutcomeSide("away")}
      />
    </div>
  );
}
