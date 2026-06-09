import type { OpenOrderMarketContext } from "@/lib/portfolio/teams-condition";
import type { UserOpenOrder } from "@/lib/portfolio/types";

export type OpenOrderMarketGroup = {
  marketId: string;
  orders: UserOpenOrder[];
  latestCreatedAt: number;
};

export function resolveOpenOrderMarketTitle(
  order: UserOpenOrder,
  marketContextMap: Record<string, OpenOrderMarketContext>
): string {
  const marketContext = marketContextMap[order.market];
  const teams = marketContext?.teams ?? [];

  if (teams.length === 1) {
    const teamName = teams[0]?.name?.trim();

    if (teamName) {
      return `Will ${teamName} win the 2026 FIFA World Cup?`;
    }
  }

  const mappedTitle = marketContext?.title?.trim();

  if (mappedTitle) {
    return mappedTitle;
  }

  return order.outcome || order.market || order.asset_id;
}

export function groupOpenOrdersByMarket(
  orders: UserOpenOrder[]
): OpenOrderMarketGroup[] {
  const groups = new Map<string, UserOpenOrder[]>();

  for (const order of orders) {
    const marketId = order.market?.trim() || order.asset_id;

    if (!marketId) {
      continue;
    }

    const existing = groups.get(marketId);

    if (existing) {
      existing.push(order);
    } else {
      groups.set(marketId, [order]);
    }
  }

  return [...groups.entries()]
    .map(([marketId, marketOrders]) => {
      const sortedOrders = [...marketOrders].sort(
        (left, right) => right.created_at - left.created_at
      );
      const latestCreatedAt = sortedOrders[0]?.created_at ?? 0;

      return {
        marketId,
        orders: sortedOrders,
        latestCreatedAt
      };
    })
    .sort((left, right) => right.latestCreatedAt - left.latestCreatedAt);
}
