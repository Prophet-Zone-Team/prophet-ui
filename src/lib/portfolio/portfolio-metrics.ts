import {
  CLOSED_MARKET_DISABLED_REASON,
  isMarketClosedForTrading
} from "@/lib/market/trading-market-status";
import type { CashBalanceView } from "@/types/funding";
import type {
  OrderOutcomeSide,
  TeamMarketSnapshot,
  UserPositionRecord
} from "@/types/market";
import type {
  PortfolioSeriesPoint,
  UserActivityRecord,
  UserOpenOrder
} from "@/lib/portfolio/types";

export function safeNumber(value: number | undefined): number {
  return Number.isFinite(value) ? (value ?? 0) : 0;
}

export function canRedeemPosition(position: UserPositionRecord): boolean {
  return position.redeemable && position.size > 0;
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

export function findSnapshotForConditionId(
  conditionId: string,
  snapshots: TeamMarketSnapshot[]
): TeamMarketSnapshot | undefined {
  return snapshots.find(
    (snapshot) => snapshot.market.polymarket?.conditionId === conditionId
  );
}

export function isPortfolioMarketClosedForTrading(input: {
  snapshot?: TeamMarketSnapshot;
  endDate?: string;
}): boolean {
  if (
    input.snapshot &&
    isMarketClosedForTrading(input.snapshot.market.polymarket?.closed)
  ) {
    return true;
  }

  if (input.endDate) {
    const end = new Date(input.endDate);

    if (!Number.isNaN(end.getTime()) && end.getTime() <= Date.now()) {
      return true;
    }
  }

  return false;
}

export function getPortfolioMarketClosedDisabledReason(input: {
  snapshot?: TeamMarketSnapshot;
  endDate?: string;
}): string | undefined {
  return isPortfolioMarketClosedForTrading(input)
    ? CLOSED_MARKET_DISABLED_REASON
    : undefined;
}

export function isAuthoritativeSnapshotForPosition(
  position: UserPositionRecord,
  snapshot: TeamMarketSnapshot
): boolean {
  return (
    findSnapshotForTokenId(position.asset, [snapshot]) !== undefined ||
    findSnapshotForConditionId(position.conditionId, [snapshot]) !== undefined
  );
}

export function resolveOutcomeSideForPosition(
  position: UserPositionRecord,
  snapshot: TeamMarketSnapshot
): OrderOutcomeSide {
  const tokens = snapshot.market.polymarket?.tokens;

  if (tokens?.yes?.tokenId === position.asset) {
    return "yes";
  }

  if (tokens?.no?.tokenId === position.asset) {
    return "no";
  }

  const normalizedOutcome = position.outcome.trim().toLowerCase();

  if (
    tokens?.yes?.outcome &&
    tokens.yes.outcome.trim().toLowerCase() === normalizedOutcome
  ) {
    return "yes";
  }

  if (
    tokens?.no?.outcome &&
    tokens.no.outcome.trim().toLowerCase() === normalizedOutcome
  ) {
    return "no";
  }

  return position.outcomeIndex === 0 ? "yes" : "no";
}

export function derivePositionSellReceiveAmount(
  position: UserPositionRecord,
  selectedShares: number
): number {
  if (position.size <= 0 || selectedShares <= 0) {
    return 0;
  }

  const ratio = Math.min(1, selectedShares / position.size);
  return roundMoney(position.currentValue * ratio);
}

export function buildPositionTimeMap(
  activityHistory: UserActivityRecord[]
): Map<string, string> {
  const map = new Map<string, string>();

  for (const activity of activityHistory) {
    const tokenId = activity.asset;
    const existing = map.get(tokenId);
    const activityTime = new Date(activity.timestamp * 1000).toISOString();

    if (!existing || new Date(activityTime).getTime() > new Date(existing).getTime()) {
      map.set(tokenId, activityTime);
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
  cash,
  activityHistory
}: {
  positions: UserPositionRecord[];
  snapshots: TeamMarketSnapshot[];
  cash?: CashBalanceView;
  activityHistory: UserActivityRecord[];
}): PortfolioViewModel {
  const totalPositionValue = roundMoney(
    positions.reduce((sum, position) => sum + safeNumber(position.currentValue), 0)
  );
  const availableToTrade = safeNumber(cash?.available);
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
  const positionTimeMap = buildPositionTimeMap(activityHistory);

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
