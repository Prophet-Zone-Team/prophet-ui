import type {
  CopyPnLSummary,
  CopyTarget,
  CopyTradeUserOrder
} from "@/types/copy-trade-api";

export interface CopyTargetDisplayStats {
  totalBuy: number | null;
  totalSell: number | null;
  buyCount: number;
  sellCount: number;
  pnl: number | null;
  lastTradeAt: string | null;
}

function normalizeWallet(wallet: string): string {
  return wallet.toLowerCase();
}

function orderMatchesTarget(
  order: CopyTradeUserOrder,
  wallet: string
): boolean {
  const normalized = normalizeWallet(wallet);
  const key = order.TargetEventKey.toLowerCase();

  return key.includes(normalized);
}

function ensureStats(
  map: Map<string, CopyTargetDisplayStats>,
  wallet: string
): CopyTargetDisplayStats {
  const key = normalizeWallet(wallet);
  let stats = map.get(key);

  if (!stats) {
    stats = {
      totalBuy: null,
      totalSell: null,
      buyCount: 0,
      sellCount: 0,
      pnl: null,
      lastTradeAt: null
    };
    map.set(key, stats);
  }

  return stats;
}

function updateLastTradeAt(
  stats: CopyTargetDisplayStats,
  iso: string | undefined
): void {
  if (!iso) {
    return;
  }

  const next = new Date(iso).getTime();

  if (Number.isNaN(next)) {
    return;
  }

  const current = stats.lastTradeAt
    ? new Date(stats.lastTradeAt).getTime()
    : Number.NaN;

  if (Number.isNaN(current) || next > current) {
    stats.lastTradeAt = iso;
  }
}

export function buildCopyTargetStatsMap(
  targets: CopyTarget[],
  pnl: CopyPnLSummary | null,
  orders: CopyTradeUserOrder[]
): Map<string, CopyTargetDisplayStats> {
  const map = new Map<string, CopyTargetDisplayStats>();

  for (const target of targets) {
    ensureStats(map, target.Wallet);
  }

  if (pnl) {
    for (const targetPnL of pnl.targets) {
      const stats = ensureStats(map, targetPnL.target_wallet);
      stats.pnl = targetPnL.cash_pnl;
    }

    for (const position of [...pnl.positions, ...pnl.history]) {
      const stats = ensureStats(map, position.target_wallet);

      if (position.buy_spent_usd > 0) {
        stats.totalBuy =
          (stats.totalBuy ?? 0) + position.buy_spent_usd;
      }

      if (position.sell_proceeds_usd > 0) {
        stats.totalSell =
          (stats.totalSell ?? 0) + position.sell_proceeds_usd;
      }

      updateLastTradeAt(stats, position.last_trade_at);
    }
  }

  for (const order of orders) {
    const wallet = targets.find((target) =>
      orderMatchesTarget(order, target.Wallet)
    )?.Wallet;

    if (!wallet) {
      continue;
    }

    const stats = ensureStats(map, wallet);
    const side = order.Side.toUpperCase();

    if (side === "BUY") {
      stats.buyCount += 1;
    } else if (side === "SELL") {
      stats.sellCount += 1;
    }

    updateLastTradeAt(stats, order.CreatedAt);
  }

  return map;
}

export function getCopyTargetStats(
  map: Map<string, CopyTargetDisplayStats>,
  wallet: string
): CopyTargetDisplayStats | null {
  return map.get(normalizeWallet(wallet)) ?? null;
}
