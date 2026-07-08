import {
  resolvePortfolioPositionIcon,
  type OpenOrderMarketContext
} from "@/lib/portfolio/teams-condition";
import type { CopyPositionPnL } from "@/types/copy-trade-api";
import type { UserPositionRecord } from "@/types/market";
import type { CopyWalletPositionDisplay } from "@/views/copy-trade/copied-wallet/positions-panel/types";

export interface MapCopyPositionPnLOptions {
  proxyWallet?: string;
}

function resolveMarketContext(
  conditionId: string,
  marketContextMap: Record<string, OpenOrderMarketContext>
): OpenOrderMarketContext | undefined {
  return marketContextMap[conditionId.trim()];
}

export function collectUniqueConditionIdsFromCopyPositionPnL(
  rows: CopyPositionPnL[]
): string[] {
  const ids = new Set<string>();

  for (const row of rows) {
    const conditionId = row.condition_id?.trim();

    if (conditionId) {
      ids.add(conditionId);
    }
  }

  return [...ids];
}

export function mapCopyPositionPnLToActiveDisplay(
  row: CopyPositionPnL,
  marketContextMap: Record<string, OpenOrderMarketContext>
): CopyWalletPositionDisplay {
  const context = resolveMarketContext(row.condition_id, marketContextMap);
  const positionLike = mapCopyPositionPnLToUserPositionRecord(row);

  return {
    id: row.token_id || `${row.condition_id}:${row.outcome}`,
    status: "active",
    title: row.title,
    outcome: row.outcome,
    avgPrice: row.avg_price,
    currentPrice: row.cur_price,
    shares: row.size,
    currentValue: row.current_value,
    cashPnl: row.cash_pnl,
    percentPnl: row.percent_pnl,
    lastTradeAt: row.last_trade_at?.trim() ?? "",
    icon: resolvePortfolioPositionIcon(positionLike, context?.teams ?? [], {
      contextIcon: context?.icon,
      marketKind: context?.marketKind
    })
  };
}

export function mapCopyPositionPnLToEndedDisplay(
  row: CopyPositionPnL,
  marketContextMap: Record<string, OpenOrderMarketContext>
): CopyWalletPositionDisplay {
  const context = resolveMarketContext(row.condition_id, marketContextMap);
  const positionLike = mapCopyPositionPnLToUserPositionRecord(row);
  const currentValue = row.spent_usd > 0 ? row.spent_usd : row.initial_value;
  const cashPnl = row.realized_pnl ?? row.cash_pnl;

  return {
    id: row.token_id || `${row.condition_id}:${row.outcome}`,
    status: "ended",
    title: row.title,
    outcome: row.outcome,
    avgPrice: row.avg_price,
    currentPrice: row.cur_price,
    shares: row.size,
    currentValue,
    cashPnl,
    percentPnl: row.percent_pnl,
    lastTradeAt: row.last_trade_at?.trim() ?? "",
    icon: resolvePortfolioPositionIcon(positionLike, context?.teams ?? [], {
      contextIcon: context?.icon,
      marketKind: context?.marketKind
    })
  };
}

export function mapActiveCopyPositionPnLToDisplay(
  rows: CopyPositionPnL[],
  marketContextMap: Record<string, OpenOrderMarketContext>
): CopyWalletPositionDisplay[] {
  return rows
    .filter((row) => row.current_value !== 0)
    .map((row) => mapCopyPositionPnLToActiveDisplay(row, marketContextMap));
}

export function mapEndedCopyPositionPnLToDisplay(
  rows: CopyPositionPnL[],
  marketContextMap: Record<string, OpenOrderMarketContext>
): CopyWalletPositionDisplay[] {
  return rows.map((row) =>
    mapCopyPositionPnLToEndedDisplay(row, marketContextMap)
  );
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

export function mapCopyPositionPnLToClosedUserPositionRecord(
  row: CopyPositionPnL,
  options?: MapCopyPositionPnLOptions
): UserPositionRecord {
  return {
    ...mapCopyPositionPnLToUserPositionRecord(row, options),
    currentValue: row.sell_proceeds_usd
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
