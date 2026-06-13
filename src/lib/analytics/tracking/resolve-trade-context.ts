import type { BidOrderPreview } from "@/lib/market/polymarket-order";
import type { TeamMarketSnapshot } from "@/types/market";

type TradeTicketVariantInput =
  | {
      variant: "team";
      snapshot: TeamMarketSnapshot;
    }
  | {
      variant: "game";
      gameSnapshot: { match: { id: string } };
    };

export function resolveTradeAnalyticsContext(
  input: TradeTicketVariantInput,
  preview?: BidOrderPreview,
  tradeSide?: string
) {
  if (input.variant === "team") {
    return {
      teamId: input.snapshot.team.id,
      teamName: input.snapshot.team.name,
      teamCode: input.snapshot.team.code,
      marketId: input.snapshot.market.polymarket?.conditionId,
      outcomeId: preview?.tokenId,
      side: tradeSide ?? preview?.tradeSide,
      price: preview?.sidePrice,
      amount: preview?.estimatedTotalCost,
      size: preview?.shareSize
    };
  }

  return {
    teamId: input.gameSnapshot.match.id,
    marketId: preview?.tokenId,
    outcomeId: preview?.tokenId,
    side: tradeSide ?? preview?.tradeSide,
    price: preview?.sidePrice,
    amount: preview?.estimatedTotalCost,
    size: preview?.shareSize
  };
}
