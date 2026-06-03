import {
  buildBidOrderPreview,
  type BidOrderPreview
} from "@/lib/market/polymarket-order";
import { getDefaultTradeLimitPrice } from "@/lib/market/trade-ticket";
import type { TeamMarketSnapshot } from "@/types/market";

const TEAM_MARKET_BUY_OUTCOME = "yes" as const;
const TEAM_MARKET_BUY_SIDE = "buy" as const;
const TEAM_MARKET_BUY_ORDER_TYPE = "FAK" as const;

export type TeamMarketBuyValidation = {
  valid: boolean;
  reason?: string;
};

export function buildTeamMarketBuyPreview(
  snapshot: TeamMarketSnapshot,
  amount: number
): BidOrderPreview {
  return buildBidOrderPreview({
    snapshot,
    outcomeSide: TEAM_MARKET_BUY_OUTCOME,
    tradeSide: TEAM_MARKET_BUY_SIDE,
    amount,
    limitPrice: getDefaultTradeLimitPrice(snapshot, TEAM_MARKET_BUY_OUTCOME),
    orderType: TEAM_MARKET_BUY_ORDER_TYPE
  });
}

export function getTeamMarketBuyValidation(
  preview: BidOrderPreview
): TeamMarketBuyValidation {
  if (preview.canSubmitRealOrder) {
    return { valid: true };
  }

  return {
    valid: false,
    reason:
      preview.disabledReason ?? "This market is not available for real orders."
  };
}

export const TEAM_MARKET_BUY_ORDER_TYPE_EXPORT = TEAM_MARKET_BUY_ORDER_TYPE;
