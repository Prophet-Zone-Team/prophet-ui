import type { CopyTarget } from "@/types/copy-trade-api";

export interface CopyTargetDisplayStats {
  totalBuy: number | null;
  totalSell: number | null;
  buyCount: number;
  sellCount: number;
  pnl: number | null;
  lastTradeAt: string | null;
}

export function copyTargetToDisplayStats(
  target: CopyTarget
): CopyTargetDisplayStats {
  return {
    totalBuy: target.BuyVolumePUSD ?? null,
    totalSell: target.SellVolumePUSD ?? null,
    buyCount: target.BuyTradeCount ?? 0,
    sellCount: target.SellTradeCount ?? 0,
    pnl: target.PnL?.realized_pnl ?? null,
    lastTradeAt: target.LastTradeAt?.trim() || null
  };
}
