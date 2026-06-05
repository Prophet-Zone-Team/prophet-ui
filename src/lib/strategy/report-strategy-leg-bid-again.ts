import type { BidOrderPreview } from "@/lib/market/polymarket-order";
import {
  isProphetAuthenticated,
  updateProphetUserStrategyItem
} from "@/service/prophet";
import type { ProphetStrategyTeamItemReq } from "@/types/prophet-api";
import type { TeamMarketSnapshot, UserOrderPreview } from "@/types/market";
import type { SubmitOrderResult } from "@/views/trade/trade-widget/trade-ticket-helpers";

function formatStrategyTeamAmount(value: number): string {
  return Number.isFinite(value) ? String(value) : "0";
}

function buildStrategyTeamItemReq(input: {
  snapshot: TeamMarketSnapshot;
  preview: BidOrderPreview;
  userOrderPreview: UserOrderPreview;
  result: SubmitOrderResult;
}): ProphetStrategyTeamItemReq | null {
  const orderId =
    input.result.order?.clobOrderId ?? input.result.order?.id ?? undefined;

  if (!orderId) {
    return null;
  }

  const amount =
    input.userOrderPreview.estimatedTotalCost ??
    input.userOrderPreview.estimatedCost;

  return {
    order_id: orderId,
    tx_hash: orderId,
    amount: formatStrategyTeamAmount(amount),
    name: input.snapshot.team.name,
    price: String(input.preview.sidePrice),
    slug:
      input.snapshot.market.slug ?? input.snapshot.market.polymarket?.slug,
    curr_price: String(input.snapshot.market.probability)
  };
}

export async function reportStrategyLegBidAgain(input: {
  strategyId: number;
  snapshot: TeamMarketSnapshot;
  preview: BidOrderPreview;
  userOrderPreview: UserOrderPreview;
  result: SubmitOrderResult;
}): Promise<void> {
  if (!isProphetAuthenticated()) {
    return;
  }

  if (!Number.isFinite(input.strategyId) || input.strategyId <= 0) {
    return;
  }

  const team = buildStrategyTeamItemReq(input);

  if (!team) {
    return;
  }

  try {
    await updateProphetUserStrategyItem({
      strategy_id: input.strategyId,
      team
    });
  } catch (error) {
    console.warn("[user.strategy.item] report failed", error);
  }
}
