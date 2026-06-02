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

export type ReportTradeOrderTransactionInput = {
  userOrderPreview: UserOrderPreview;
  result: SubmitOrderResult;
  preview: BidOrderPreview;
} & (
  | { variant: "team"; snapshot: TeamMarketSnapshot }
  | {
      variant: "game";
      gameSnapshot: GameMarketSnapshot;
      fixtureOutcome?: FixtureMarketOutcome | null;
    }
);

/** Fire-and-forget trade report after a successful primary order submit. */
export async function reportTradeOrderTransaction(
  input: ReportTradeOrderTransactionInput
): Promise<void> {
  if (!isProphetAuthenticated()) {
    return;
  }

  const txHash =
    input.result.order?.clobOrderId ?? input.result.order?.id ?? undefined;

  if (!txHash) {
    return;
  }

  const type = input.userOrderPreview.side;

  if (type !== "buy" && type !== "sell") {
    return;
  }

  let market: ProphetReportTransactionMarket;

  if (input.variant === "team") {
    market = {
      slug:
        input.snapshot.market.slug ??
        input.snapshot.market.polymarket?.slug,
      teamName: input.snapshot.team.name,
      marketName: input.snapshot.market.polymarket?.question,
      price: String(input.preview.sidePrice),
      side: input.preview.outcomeSide
    };
  } else {
    const match = input.gameSnapshot.match;
    const label =
      input.fixtureOutcome?.label ??
      `${match.homeDisplayName ?? "Home"} vs ${match.awayDisplayName ?? "Away"}`;

    market = {
      slug: match.polymarket?.slug,
      teamName: label,
      marketName: label,
      price: String(input.preview.sidePrice),
      side: input.preview.outcomeSide
    };
  }

  const request: ProphetReportTransactionRequest = {
    amount: resolveTransactionAmount(input.userOrderPreview),
    tx_hash: txHash,
    type,
    market
  };

  try {
    await reportProphetUserTransaction(request);
  } catch (error) {
    console.warn("[user.transaction] report failed", error);
  }
}
