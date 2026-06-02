import type { BidOrderPreview } from "@/lib/market/polymarket-order";
import {
  isProphetAuthenticated,
  reportProphetUserTransaction
} from "@/service/prophet";
import type {
  ProphetReportTransactionMarket,
  ProphetReportTransactionRequest
} from "@/types/prophet-api";
import type {
  FixtureMarketOutcome,
  GameMarketSnapshot,
  TeamMarketSnapshot,
  UserOrderPreview
} from "@/types/market";
import type { SubmitOrderResult } from "@/views/trade/trade-widget/trade-ticket-helpers";

function formatTransactionAmount(value: number): string {
  return Number.isFinite(value) ? String(value) : "0";
}

function resolveTransactionAmount(preview: UserOrderPreview): string {
  if (preview.side === "buy") {
    return formatTransactionAmount(
      preview.estimatedTotalCost ?? preview.estimatedCost
    );
  }

  return formatTransactionAmount(
    preview.estimatedProceeds ?? preview.estimatedCost
  );
}

export function buildReportTransactionMarketFromTeam(
  snapshot: TeamMarketSnapshot,
  preview: BidOrderPreview
): ProphetReportTransactionMarket {
  return {
    slug: snapshot.market.slug ?? snapshot.market.polymarket?.slug,
    teamName: snapshot.team.name,
    marketName: snapshot.market.polymarket?.question,
    price: String(preview.sidePrice),
    side: preview.outcomeSide
  };
}

export function buildReportTransactionMarketFromGame(
  gameSnapshot: GameMarketSnapshot,
  preview: BidOrderPreview,
  fixtureOutcome?: FixtureMarketOutcome | null
): ProphetReportTransactionMarket {
  const match = gameSnapshot.match;
  const home = match.homeDisplayName ?? "Home";
  const away = match.awayDisplayName ?? "Away";

  return {
    slug: match.polymarket?.slug,
    teamName: fixtureOutcome?.label ?? `${home} vs ${away}`,
    marketName: fixtureOutcome?.label ?? `${home} vs ${away}`,
    price: String(preview.sidePrice),
    side: preview.outcomeSide
  };
}

export function buildReportTransactionRequest(input: {
  userOrderPreview: UserOrderPreview;
  result: SubmitOrderResult;
  market: ProphetReportTransactionMarket;
}): ProphetReportTransactionRequest | null {
  const txHash =
    input.result.order?.clobOrderId ?? input.result.order?.id ?? undefined;

  if (!txHash) {
    return null;
  }

  const type = input.userOrderPreview.side;

  if (type !== "buy" && type !== "sell") {
    return null;
  }

  return {
    amount: resolveTransactionAmount(input.userOrderPreview),
    tx_hash: txHash,
    type,
    market: input.market
  };
}

/** Fire-and-forget trade report after a successful primary order submit. */
export async function reportTradeOrderTransaction(input: {
  userOrderPreview: UserOrderPreview;
  result: SubmitOrderResult;
  market: ProphetReportTransactionMarket;
}): Promise<void> {
  if (!isProphetAuthenticated()) {
    return;
  }

  const request = buildReportTransactionRequest(input);

  if (!request) {
    return;
  }

  try {
    await reportProphetUserTransaction(request);
  } catch (error) {
    console.warn("[user.transaction] report failed", error);
  }
}
