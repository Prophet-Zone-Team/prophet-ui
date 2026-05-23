import type {
  TeamMarketSnapshot,
  UserOrderRecord,
  UserPositionRecord,
  UserTradingReadiness
} from "@/types/market";
import type { PortfolioSeriesPoint, UserOpenOrder } from "@/lib/portfolio/types";

export function safeNumber(value: number | undefined): number {
  return Number.isFinite(value) ? (value ?? 0) : 0;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function findSnapshotForPosition(
  position: UserPositionRecord,
  snapshots: TeamMarketSnapshot[]
): TeamMarketSnapshot | undefined {
  const text = `${position.title} ${position.slug} ${position.eventSlug ?? ""}`.toLowerCase();

  return snapshots.find((snapshot) => {
    const names = [
      snapshot.team.id,
      snapshot.team.name,
      snapshot.team.code,
      ...(snapshot.team.aliases ?? [])
    ]
      .filter(Boolean)
      .map((value) => value.toLowerCase());

    return names.some((name) => text.includes(name));
  });
}

export function findSnapshotForTokenId(
  assetId: string,
  snapshots: TeamMarketSnapshot[]
): TeamMarketSnapshot | undefined {
  return snapshots.find((snapshot) => {
    const tokens = snapshot.market.polymarket?.tokens;
    return tokens?.yes?.tokenId === assetId || tokens?.no?.tokenId === assetId;
  });
}

export function buildPositionTimeMap(
  orderHistory: UserOrderRecord[]
): Map<string, string> {
  const map = new Map<string, string>();

  for (const order of orderHistory) {
    const tokenId = order.preview.tokenId;
    const existing = map.get(tokenId);
    const orderTime = order.updatedAt ?? order.submittedAt;

    if (!orderTime) {
      continue;
    }

    if (!existing || new Date(orderTime).getTime() > new Date(existing).getTime()) {
      map.set(tokenId, orderTime);
    }
  }

  return map;
}

export function buildPerformanceSeries(
  positions: UserPositionRecord[],
  snapshots: TeamMarketSnapshot[],
  portfolioValue: number,
  pnl: number
): PortfolioSeriesPoint[] {
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
  });

  if (positions.length === 0 || portfolioValue <= 0) {
    return dates.map((date) => ({ date, value: 0 }));
  }

  const base = Math.max(0, portfolioValue - pnl);
  const movementBias = positions.reduce((sum, position) => {
    const snapshot = findSnapshotForPosition(position, snapshots);
    return sum + (snapshot?.market.change7d ?? 0) * safeNumber(position.currentValue) * 0.003;
  }, 0);

  return dates.map((date, index) => {
    const progress = index / Math.max(1, dates.length - 1);
    const value = base + pnl * progress + Math.sin(index * 1.7) * movementBias;
    return { date, value: roundMoney(Math.max(0, value)) };
  });
}

export interface PortfolioViewModel {
  portfolioValue: number;
  availableToTrade: number;
  totalPositionValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  performanceSeries: PortfolioSeriesPoint[];
  positionTimeMap: Map<string, string>;
}

export function buildPortfolioView({
  positions,
  snapshots,
  readiness,
  orderHistory
}: {
  positions: UserPositionRecord[];
  snapshots: TeamMarketSnapshot[];
  readiness?: UserTradingReadiness;
  orderHistory: UserOrderRecord[];
}): PortfolioViewModel {
  const totalPositionValue = roundMoney(
    positions.reduce((sum, position) => sum + safeNumber(position.currentValue), 0)
  );
  const availableToTrade = safeNumber(readiness?.balances?.usdcAvailable);
  const portfolioValue = roundMoney(totalPositionValue + availableToTrade);
  const unrealizedPnl = roundMoney(
    positions.reduce((sum, position) => sum + safeNumber(position.cashPnl), 0)
  );
  const costBasis = totalPositionValue - unrealizedPnl;
  const unrealizedPnlPercent =
    costBasis > 0 ? roundMoney((unrealizedPnl / costBasis) * 100) : 0;
  const performanceSeries = buildPerformanceSeries(
    positions,
    snapshots,
    portfolioValue,
    unrealizedPnl
  );
  const positionTimeMap = buildPositionTimeMap(orderHistory);

  return {
    portfolioValue,
    availableToTrade,
    totalPositionValue,
    unrealizedPnl,
    unrealizedPnlPercent,
    performanceSeries,
    positionTimeMap
  };
}
