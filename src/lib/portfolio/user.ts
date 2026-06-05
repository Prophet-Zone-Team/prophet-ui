import type { BidOrderPreview } from "@/lib/market/polymarket-order";
import { derivePositionSellReceiveAmount } from "@/lib/portfolio/portfolio-metrics";
import {
  resolveReportOrderStatus,
  resolveReportOrderType,
  resolveReportOrderValueUsdc,
  resolveReportReferralCode
} from "@/lib/portfolio/report-trade-order";
import { resolveReportTeamName } from "@/lib/portfolio/teams-condition";
import { formatMatchVersusTitle } from "@/lib/market/trade-widget-header";
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
  UserOrderPreview,
  UserPositionRecord
} from "@/types/market";
import type { SubmitOrderResult } from "@/views/trade/trade-widget/trade-ticket-helpers";

function formatTransactionAmount(value: number): string {
  return Number.isFinite(value) ? String(value) : "0";
}

function normalizeFundingAmount(value: number | string): string {
  if (typeof value === "number") {
    return formatTransactionAmount(value);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "0";
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? String(parsed) : "0";
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

export type ReportFundingTransactionInput = {
  type: "deposit" | "withdraw" | "claim";
  txHash: string;
  amount: number | string;
};

export type ReportRedeemTransactionInput = {
  position: UserPositionRecord;
  teamName?: string;
  txHash: string;
};

export async function reportFundingTransaction(
  input: ReportFundingTransactionInput
): Promise<void> {
  if (!isProphetAuthenticated()) {
    return;
  }

  const txHash = input.txHash.trim();

  if (!txHash) {
    return;
  }

  const request: ProphetReportTransactionRequest = {
    amount: normalizeFundingAmount(input.amount),
    tx_hash: txHash,
    type: input.type
  };

  try {
    await reportProphetUserTransaction(request);
  } catch (error) {
    console.warn("[user.transaction] report failed", error);
  }
}

/** Fire-and-forget redeem report after a successful position redemption. */
export async function reportRedeemTransaction(
  input: ReportRedeemTransactionInput
): Promise<void> {
  if (!isProphetAuthenticated()) {
    return;
  }

  const txHash = input.txHash.trim();

  if (!txHash) {
    return;
  }

  const { position } = input;
  const teamName = resolveReportTeamName({
    candidate: input.teamName,
    title: position.title,
    outcome: position.outcome
  });
  const market: ProphetReportTransactionMarket = {
    slug: position.eventSlug ?? position.slug,
    teamName,
    marketName: position.title,
    price: String(position.curPrice),
    side: position.outcome
  };

  const request: ProphetReportTransactionRequest = {
    amount: formatTransactionAmount(
      derivePositionSellReceiveAmount(position, position.size)
    ),
    tx_hash: txHash,
    type: "redeem",
    market
  };

  try {
    await reportProphetUserTransaction(request);
  } catch (error) {
    console.warn("[user.transaction] report failed", error);
  }
}

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
    const question = input.snapshot.market.polymarket?.question ?? "";

    market = {
      slug:
        input.snapshot.market.slug ??
        input.snapshot.market.polymarket?.slug,
      teamName: resolveReportTeamName({
        candidate: input.snapshot.team.name,
        title: question,
        outcome: input.preview.outcomeSide
      }),
      marketName: question,
      price: String(input.preview.sidePrice),
      side: input.preview.outcomeSide
    };
  } else {
    const match = input.gameSnapshot.match;
    const homeName = match.homeDisplayName ?? "Home";
    const awayName = match.awayDisplayName ?? "Away";
    const label =
      input.fixtureOutcome?.label?.trim() ??
      formatMatchVersusTitle(homeName, awayName);

    market = {
      slug: match.polymarket?.slug,
      teamName: resolveReportTeamName({
        candidate: label,
        title: label,
        outcome: input.preview.outcomeSide,
        homeName,
        awayName,
        fixtureSide: input.fixtureOutcome?.side
      }),
      marketName: label,
      price: String(input.preview.sidePrice),
      side: input.preview.outcomeSide
    };
  }

  const orderValueUsdc = resolveReportOrderValueUsdc(input.userOrderPreview);
  const referralCode = resolveReportReferralCode();

  const request: ProphetReportTransactionRequest = {
    amount: orderValueUsdc,
    tx_hash: txHash,
    type,
    market,
    order_type: resolveReportOrderType(input.userOrderPreview.orderType),
    order_status: resolveReportOrderStatus(input.result.order?.status),
    order_value_usdc: orderValueUsdc,
    ...(referralCode ? { referral_code: referralCode } : {})
  };

  try {
    await reportProphetUserTransaction(request);
  } catch (error) {
    console.warn("[user.transaction] report failed", error);
  }
}
