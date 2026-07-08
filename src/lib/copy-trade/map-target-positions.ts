import {
  collectUniqueConditionIdsFromPositions,
  resolvePortfolioPositionIcon,
  type OpenOrderMarketContext
} from "@/lib/portfolio/teams-condition";
import type { CopyWalletPositionDisplay } from "@/views/copy-trade/copied-wallet/positions-panel/types";
import type { UserClosedPositionRecord, UserPositionRecord } from "@/types/market";

export function collectUniqueConditionIdsFromClosedPositions(
  positions: UserClosedPositionRecord[]
): string[] {
  const ids = new Set<string>();

  for (const position of positions) {
    const conditionId = position.conditionId?.trim();

    if (conditionId) {
      ids.add(conditionId);
    }
  }

  return [...ids];
}

function resolveMarketContext(
  conditionId: string,
  marketContextMap: Record<string, OpenOrderMarketContext>
): OpenOrderMarketContext | undefined {
  return marketContextMap[conditionId.trim()];
}

export function mapActiveTargetPositionsToDisplay(
  positions: UserPositionRecord[],
  marketContextMap: Record<string, OpenOrderMarketContext>
): CopyWalletPositionDisplay[] {
  return positions
    .filter((position) => position.currentValue !== 0)
    .map((position) => {
      const context = resolveMarketContext(position.conditionId, marketContextMap);

      return {
        id: position.asset || `${position.conditionId}:${position.outcome}`,
        status: "active",
        title: position.title,
        outcome: position.outcome,
        avgPrice: position.avgPrice,
        currentPrice: position.curPrice,
        shares: position.size,
        currentValue: position.currentValue,
        cashPnl: position.cashPnl,
        percentPnl: position.percentPnl,
        lastTradeAt: position.endDate?.trim() ?? "",
        icon: resolvePortfolioPositionIcon(position, context?.teams ?? [], {
          contextIcon: context?.icon,
          marketKind: context?.marketKind
        })
      };
    });
}

export function mapEndedTargetPositionsToDisplay(
  positions: UserClosedPositionRecord[],
  marketContextMap: Record<string, OpenOrderMarketContext>
): CopyWalletPositionDisplay[] {
  return positions.map((position) => {
    const context = resolveMarketContext(position.conditionId, marketContextMap);
    const shares =
      position.avgPrice > 0 ? position.totalBought / position.avgPrice : 0;
    const percentPnl =
      position.totalBought > 0
        ? (position.realizedPnl / position.totalBought) * 100
        : 0;

    return {
      id: position.asset || `${position.conditionId}:${position.outcome}`,
      status: "ended",
      title: position.title,
      outcome: position.outcome,
      avgPrice: position.avgPrice,
      currentPrice: position.curPrice,
      shares,
      currentValue: position.totalBought,
      cashPnl: position.realizedPnl,
      percentPnl,
      lastTradeAt: new Date(position.timestamp * 1000).toISOString(),
      icon: resolvePortfolioPositionIcon(position, context?.teams ?? [], {
        contextIcon: context?.icon,
        marketKind: context?.marketKind
      })
    };
  });
}

export function collectConditionIdsForTargetPositions(
  activePositions: UserPositionRecord[],
  closedPositions: UserClosedPositionRecord[]
): string[] {
  const ids = new Set<string>();

  for (const id of collectUniqueConditionIdsFromPositions(activePositions)) {
    ids.add(id);
  }

  for (const id of collectUniqueConditionIdsFromClosedPositions(closedPositions)) {
    ids.add(id);
  }

  return [...ids];
}
