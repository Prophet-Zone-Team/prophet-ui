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

export interface GamePositionTokenMatch {
  yesTokenId?: string;
  noTokenId?: string;
  yesOutcome?: string;
  noOutcome?: string;
}
import type {
  PortfolioTransactionRecord,
  UserOpenOrder
} from "@/lib/portfolio/types";

export function safeNumber(value: number | undefined): number {
  return Number.isFinite(value) ? (value ?? 0) : 0;
}

export function canRedeemPosition(position: UserPositionRecord): boolean {
  return position.redeemable && position.size > 0 && position.curPrice > 0;
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

export function resolveOutcomeSideForGamePosition(
  position: UserPositionRecord,
  tokens: GamePositionTokenMatch
): OrderOutcomeSide {
  if (tokens.yesTokenId && tokens.yesTokenId === position.asset) {
    return "yes";
  }

  if (tokens.noTokenId && tokens.noTokenId === position.asset) {
    return "no";
  }

  const normalizedOutcome = position.outcome.trim().toLowerCase();

  if (
    tokens.yesOutcome &&
    tokens.yesOutcome.trim().toLowerCase() === normalizedOutcome
  ) {
    return "yes";
  }

  if (
    tokens.noOutcome &&
    tokens.noOutcome.trim().toLowerCase() === normalizedOutcome
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

function transactionMatchesPosition(
  transaction: PortfolioTransactionRecord,
  position: UserPositionRecord
): boolean {
  if (transaction.slug) {
    const slugs = [position.slug, position.eventSlug].filter(Boolean);

    if (slugs.some((slug) => slug === transaction.slug)) {
      return true;
    }
  }

  if (transaction.teamName) {
    const team = transaction.teamName.toLowerCase();
    const text = `${position.title} ${position.slug}`.toLowerCase();

    if (text.includes(team)) {
      return true;
    }
  }

  return false;
}

export function buildPositionTimeMapFromTransactions(
  transactions: PortfolioTransactionRecord[],
  positions: UserPositionRecord[]
): Map<string, string> {
  const map = new Map<string, string>();

  for (const position of positions) {
    for (const transaction of transactions) {
      if (!transactionMatchesPosition(transaction, position)) {
        continue;
      }

      const existing = map.get(position.asset);
      const transactionTime = transaction.createdAt;

      if (
        !existing ||
        new Date(transactionTime).getTime() > new Date(existing).getTime()
      ) {
        map.set(position.asset, transactionTime);
      }
    }
  }

  return map;
}

export interface PortfolioViewModel {
  portfolioValue: number;
  availableToTrade: number;
  totalPositionValue: number;
  positionTimeMap: Map<string, string>;
}

export function buildPortfolioView({
  positions,
  cash,
  transactions
}: {
  positions: UserPositionRecord[];
  cash?: CashBalanceView;
  transactions: PortfolioTransactionRecord[];
}): PortfolioViewModel {
  const totalPositionValue = roundMoney(
    positions.reduce((sum, position) => sum + safeNumber(position.currentValue), 0)
  );
  const availableToTrade = safeNumber(cash?.available);
  const portfolioValue = roundMoney(totalPositionValue + availableToTrade);
  const positionTimeMap = buildPositionTimeMapFromTransactions(
    transactions,
    positions
  );

  return {
    portfolioValue,
    availableToTrade,
    totalPositionValue,
    positionTimeMap
  };
}
