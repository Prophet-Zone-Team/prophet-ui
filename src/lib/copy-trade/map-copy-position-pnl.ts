import type { CopyPositionPnL } from "@/types/copy-trade-api";
import type { UserPositionRecord } from "@/types/market";

export interface MapCopyPositionPnLOptions {
  proxyWallet?: string;
}

export function mapCopyPositionPnLToUserPositionRecord(
  row: CopyPositionPnL,
  options?: MapCopyPositionPnLOptions
): UserPositionRecord {
  return {
    proxyWallet: options?.proxyWallet ?? "",
    asset: row.token_id,
    conditionId: row.condition_id,
    size: row.size,
    avgPrice: row.avg_price,
    initialValue: row.initial_value,
    currentValue: row.current_value,
    cashPnl: row.cash_pnl,
    percentPnl: row.percent_pnl,
    totalBought: row.size,
    realizedPnl: row.realized_pnl,
    percentRealizedPnl: 0,
    curPrice: row.cur_price,
    redeemable: row.redeemable,
    mergeable: false,
    title: row.title,
    slug: row.slug,
    icon: row.icon || undefined,
    outcome: row.outcome,
    outcomeIndex: 0,
    endDate: row.end_date || undefined,
    negativeRisk: false
  };
}

export function buildCopyPositionTimeMap(
  rows: CopyPositionPnL[]
): Map<string, string> {
  const map = new Map<string, string>();

  for (const row of rows) {
    const asset = row.token_id?.trim();
    const lastTradeAt = row.last_trade_at?.trim();

    if (asset && lastTradeAt) {
      map.set(asset, lastTradeAt);
    }
  }

  return map;
}
