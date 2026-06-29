import {
  isUserImportedTrader,
  matchesTraderTagFilter,
  traderPnL24h,
  traderTotalPnL,
  traderTotalTrades,
  traderTotalVolume,
  traderTotalWinRate,
  type CopyTradeRankWalletType
} from "@/lib/copy-trade/trader-catalog-stats";
import type { TraderCatalogEntry } from "@/types/copy-trade-api";

export type { CopyTradeRankWalletType };
export type CopyTradeRankTimeRange = "1d" | "all";

export interface CopyTradeRankFilters {
  walletType: CopyTradeRankWalletType;
  timeRange: CopyTradeRankTimeRange;
  searchQuery: string;
}

export interface TraderRankDisplayStats {
  winRate: number | null;
  pnl: number | null;
  volume: number | null;
  trades: number | null;
}

export function filterCopyTradeRankTraders(
  traders: TraderCatalogEntry[],
  filters: CopyTradeRankFilters
): TraderCatalogEntry[] {
  const searchQuery = filters.searchQuery.trim().toLowerCase();

  return traders.filter((trader) => {
    if (!matchesTraderTagFilter(trader, filters.walletType)) {
      return false;
    }

    if (!searchQuery) {
      return true;
    }

    const displayName = trader.DisplayName?.toLowerCase() ?? "";
    const wallet = trader.Wallet.toLowerCase();

    return displayName.includes(searchQuery) || wallet.includes(searchQuery);
  });
}

export function sortCopyTradeRankTraders(
  traders: TraderCatalogEntry[]
): TraderCatalogEntry[] {
  return [...traders].sort((left, right) => {
    const leftImported = isUserImportedTrader(left);
    const rightImported = isUserImportedTrader(right);

    if (leftImported !== rightImported) {
      return leftImported ? -1 : 1;
    }

    return traderTotalPnL(right) - traderTotalPnL(left);
  });
}

export function resolveTraderRankDisplayStats(
  trader: TraderCatalogEntry,
  timeRange: CopyTradeRankTimeRange
): TraderRankDisplayStats {
  if (timeRange === "all") {
    return {
      winRate: traderTotalWinRate(trader),
      pnl: traderTotalPnL(trader),
      volume: traderTotalVolume(trader),
      trades: traderTotalTrades(trader)
    };
  }

  return {
    winRate: null,
    pnl: traderPnL24h(trader),
    volume: null,
    trades: null
  };
}
