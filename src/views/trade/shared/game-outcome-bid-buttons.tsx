"use client";

import { cn } from "@/lib/cn";
import { formatTradePanelPrice } from "@/lib/market/order-math";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import {
  useSetTradeMatchOutcomeSide,
  useTradeMatchOutcomeSide
} from "@/store/trade-ticket-store";
import type { GameMarketSnapshot, TeamMarketSnapshot } from "@/types/market";
import { getGameSidePrice } from "@/views/trade/game/market-section/format-bid-label";
import { gameColors } from "@/views/trade/game/ui";

export interface GameOutcomeBidButtonsProps {
  gameSnapshot: GameMarketSnapshot;
  teamSnapshots: TeamMarketSnapshot[];
}

const gameOutcomeBidButtonSizeClass = {
  default: {
    button: "h-[52px] gap-0.5 rounded-[12px]",
    title: "text-sm leading-[17px]",
    price: "text-xs leading-[14px]"
  },
  sm: {
    button: "h-[36px] gap-0 rounded-[8px]",
    title: "text-[10px] leading-3",
    price: "text-[10px] leading-3"
  }
} as const;

export type GameOutcomeBidButtonSize =
  keyof typeof gameOutcomeBidButtonSizeClass;

export interface GameOutcomeBidButtonProps {
  title: string;
  price: number;
  background: string;
  active?: boolean;
  size?: GameOutcomeBidButtonSize;
  onClick?: () => void;
}

export function GameOutcomeBidButton({
  title,
  price,
  background,
  active = false,
  size = "default",
  onClick
}: GameOutcomeBidButtonProps) {
  const sizeClass = gameOutcomeBidButtonSizeClass[size];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-center justify-center border-0 font-[556] text-white transition-opacity",
        sizeClass.button,
        onClick ? "cursor-pointer" : "cursor-default",
        onClick
          ? active
            ? "opacity-100"
            : "opacity-70 hover:opacity-85"
          : "opacity-100"
      )}
      style={{ backgroundColor: background }}
    >
      <span className={sizeClass.title}>{title}</span>
      <span className={sizeClass.price}>{formatTradePanelPrice(price)}</span>
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

  const homePrice = getGameSidePrice(gameSnapshot, "home");
  const drawPrice = getGameSidePrice(gameSnapshot, "draw");
  const awayPrice = getGameSidePrice(gameSnapshot, "away");
  const homeBidLabel =
    sides.home.code ?? sides.home.name.slice(0, 3).toUpperCase();
  const awayBidLabel =
    sides.away.code ?? sides.away.name.slice(0, 3).toUpperCase();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <GameOutcomeBidButton
        title={homeBidLabel}
        price={homePrice}
        background={gameColors.home}
        active={matchOutcomeSide === "home"}
        onClick={() => setMatchOutcomeSide("home")}
      />
      <GameOutcomeBidButton
        title="Draw"
        price={drawPrice}
        background={gameColors.draw}
        active={matchOutcomeSide === "draw"}
        onClick={() => setMatchOutcomeSide("draw")}
      />
      <GameOutcomeBidButton
        title={awayBidLabel}
        price={awayPrice}
        background={gameColors.awayBar}
        active={matchOutcomeSide === "away"}
        onClick={() => setMatchOutcomeSide("away")}
      />
    </div>
  );
}
