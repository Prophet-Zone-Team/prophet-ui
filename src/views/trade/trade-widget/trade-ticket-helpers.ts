import { buildGameBidOrderPreview } from "@/lib/market/game-order";
import {
  buildBidOrderPreview,
  type BidOrderPreview
} from "@/lib/market/polymarket-order";
import { calculateReferencePrice } from "@/lib/market/order-math";
import {
  formatDefaultGameTradeLimitPrice,
  formatDefaultTradeLimitPrice,
  getDefaultGameTradeLimitPrice,
  getDefaultTradeLimitPrice
} from "@/lib/market/trade-ticket";
import { buildSdkSignedUserOrder } from "@/lib/market/sdk-user-order";
import type { WalletClient } from "viem";
import {
  getTradingSetupSteps,
  isSetupStepComplete,
  isTradingSetupComplete
} from "@/lib/trading/trading-setup";
import { fetchJson } from "@/lib/team/client-fetch";
import type {
  AccountReadinessCheck,
  BidTradeSide,
  GameMarketSnapshot,
  OrderOutcomeSide,
  TeamMarketSnapshot,
  TradingOrderType,
  TradingUserSession,
  UserOrderPreview,
  UserOrderRecord,
  UserTradingReadiness
} from "@/types/market";
import type { TradeOrderMode } from "@/views/trade/trade-widget/trade-market-button";
import type { TradeTabId } from "@/store/trade-ticket-store";

export type TradeTicketStatus =
  | "idle"
  | "loading"
  | "signing"
  | "submitting"
  | "success"
  | "error";

export interface TradingConfig {
  builderCode?: string;
}

export interface OrderPreviewFields {
  tokenId?: string;
  estimatedCost: number;
  estimatedTakerFee: number;
  estimatedTotalCost: number;
  shareSize: number;
  sidePrice: number;
  potentialPayout: number;
  potentialOutcome: number;
  canSubmitRealOrder: boolean;
  disabledReason?: string;
}

export type BidGateAction =
  | "open_login"
  | "sign_clob"
  | "sign_tokens"
  | "show_error"
  | "retry_eligibility";

export type BidGateResult =
  | { ok: true; readiness: UserTradingReadiness }
  | { ok: false; action: BidGateAction; message: string };

export function resolveTradeSide(tab: TradeTabId): BidTradeSide {
  return tab === "sell" ? "sell" : "buy";
}

export function resolveOrderType(orderMode: TradeOrderMode): TradingOrderType {
  return orderMode === "market" ? "FAK" : "GTC";
}

export function parseOrderAmount(amount: string): number {
  const numericAmount = Number(amount);
  return Number.isFinite(numericAmount) ? Math.max(0, numericAmount) : 0;
}

export function parseLimitPriceInput(
  limitPrice: string,
  fallback: number
): number {
  const trimmed = limitPrice.trim();

  if (!trimmed) {
    return fallback;
  }

  const numeric = Number(trimmed);

  if (!Number.isFinite(numeric) || numeric <= 0 || numeric >= 1) {
    return fallback;
  }

  return numeric;
}

export function resolveOrderLimitPrice(
  orderMode: TradeOrderMode,
  userLimitPrice: number,
  defaultPrice: number
): number {
  return orderMode === "market" ? defaultPrice : userLimitPrice;
}

export function getTeamDefaultLimitPrice(
  snapshot: TeamMarketSnapshot,
  outcomeSide: OrderOutcomeSide,
  tradeSide: BidTradeSide
): number {
  const yesPrice =
    snapshot.market.polymarket?.tokens.yes?.price ??
    calculateReferencePrice(snapshot.market.probability, "yes");
  const noPrice =
    snapshot.market.polymarket?.tokens.no?.price ??
    calculateReferencePrice(snapshot.market.probability, "no");
  const sidePrice = outcomeSide === "yes" ? yesPrice : noPrice;

  if (tradeSide === "sell") {
    return sidePrice;
  }

  return getDefaultTradeLimitPrice(snapshot, outcomeSide);
}

export function getGameDefaultLimitPrice(
  gameSnapshot: GameMarketSnapshot,
  matchOutcomeSide: Parameters<typeof getDefaultGameTradeLimitPrice>[1],
  binarySide: OrderOutcomeSide,
  tradeSide: BidTradeSide
): number {
  return getDefaultGameTradeLimitPrice(
    gameSnapshot,
    matchOutcomeSide,
    binarySide,
    tradeSide
  );
}

export function buildTeamTradePreview(input: {
  snapshot: TeamMarketSnapshot;
  outcomeSide: OrderOutcomeSide;
  tradeSide: BidTradeSide;
  amount: number;
  limitPrice: number;
  orderType: TradingOrderType;
}): BidOrderPreview {
  return buildBidOrderPreview({
    snapshot: input.snapshot,
    outcomeSide: input.outcomeSide,
    tradeSide: input.tradeSide,
    amount: input.amount,
    limitPrice: input.limitPrice,
    orderType: input.orderType
  });
}

export function buildGameTradePreview(input: {
  gameSnapshot: GameMarketSnapshot;
  matchOutcomeSide: Parameters<
    typeof buildGameBidOrderPreview
  >[0]["outcomeSide"];
  binarySide: OrderOutcomeSide;
  tradeSide: BidTradeSide;
  amount: number;
  limitPrice: number;
  orderType: TradingOrderType;
}): ReturnType<typeof buildGameBidOrderPreview> {
  return buildGameBidOrderPreview({
    snapshot: input.gameSnapshot,
    outcomeSide: input.matchOutcomeSide,
    binarySide: input.binarySide,
    tradeSide: input.tradeSide,
    amount: input.amount,
    limitPrice: input.limitPrice,
    orderType: input.orderType
  });
}

export function toBidOrderPreview(
  gamePreview: ReturnType<typeof buildGameBidOrderPreview>
): BidOrderPreview {
  return {
    outcomeSide: gamePreview.binarySide,
    tradeSide: gamePreview.tradeSide,
    orderType: gamePreview.orderType,
    tokenId: gamePreview.tokenId,
    tickSize: "0.01",
    negRisk: false,
    acceptingOrders: gamePreview.acceptingOrders,
    sidePrice: gamePreview.sidePrice,
    shareSize: gamePreview.shareSize,
    inputAmount: gamePreview.inputAmount,
    estimatedCost: gamePreview.estimatedCost,
    estimatedTakerFee: gamePreview.estimatedTakerFee,
    estimatedTotalCost: gamePreview.estimatedTotalCost,
    potentialPayout: gamePreview.potentialPayout,
    potentialOutcome: gamePreview.potentialOutcome,
    canSubmitRealOrder: gamePreview.canSubmitRealOrder,
    disabledReason: gamePreview.disabledReason
  };
}

export async function fetchTradingConfig(): Promise<TradingConfig> {
  return fetchJson<TradingConfig>("/api/trading/config");
}

export async function fetchReadinessForPreview(
  preview: OrderPreviewFields,
  tradeSide: BidTradeSide
): Promise<UserTradingReadiness> {
  const query = new URLSearchParams({
    tradeSide,
    cost: String(preview.estimatedCost),
    size: String(preview.shareSize),
    totalCost: String(preview.estimatedTotalCost),
    estimatedTakerFee: String(preview.estimatedTakerFee)
  });

  if (preview.tokenId) {
    query.set("tokenId", preview.tokenId);
  }

  return fetchJson<UserTradingReadiness>(
    `/api/trading/readiness?${query.toString()}`
  );
}

export function buildTeamUserOrderPreview(
  snapshot: TeamMarketSnapshot,
  preview: BidOrderPreview
): UserOrderPreview {
  if (!preview.tokenId) {
    throw new Error("A Polymarket token ID is required before submitting.");
  }

  return {
    marketId:
      snapshot.market.polymarket?.marketId ??
      snapshot.market.polymarket?.conditionId,
    tokenId: preview.tokenId,
    teamId: snapshot.team.id,
    outcome: preview.outcomeSide,
    side: preview.tradeSide,
    orderType: preview.orderType,
    limitPrice: preview.sidePrice,
    size: preview.shareSize,
    estimatedCost: preview.estimatedCost,
    estimatedTakerFee: preview.estimatedTakerFee,
    estimatedTotalCost: preview.estimatedTotalCost,
    potentialOutcome: preview.potentialOutcome,
    tickSize: preview.tickSize ?? "0.01",
    negRisk: preview.negRisk,
    stale: false,
    warnings: preview.disabledReason ? [preview.disabledReason] : []
  };
}

export function buildGameUserOrderPreview(
  gameSnapshot: GameMarketSnapshot,
  preview: ReturnType<typeof buildGameBidOrderPreview>
): UserOrderPreview {
  if (!preview.tokenId) {
    throw new Error("A Polymarket token ID is required before submitting.");
  }

  return {
    marketId: gameSnapshot.match.polymarket?.moneyline.conditionId,
    tokenId: preview.tokenId,
    teamId: gameSnapshot.homeTeamId ?? gameSnapshot.match.id,
    outcome: preview.binarySide,
    side: preview.tradeSide,
    orderType: preview.orderType,
    limitPrice: preview.sidePrice,
    size: preview.shareSize,
    estimatedCost: preview.estimatedCost,
    estimatedTakerFee: preview.estimatedTakerFee,
    estimatedTotalCost: preview.estimatedTotalCost,
    potentialOutcome: preview.potentialOutcome,
    tickSize: "0.01",
    negRisk: false,
    stale: false,
    warnings: preview.disabledReason ? [preview.disabledReason] : []
  };
}

export function deriveTradeActionLabel(
  tradeSide: BidTradeSide,
  outcomeSide: OrderOutcomeSide,
  variant: "team" | "game"
): string {
  const sideLabel = outcomeSide === "yes" ? "Yes" : "No";
  const verb =
    tradeSide === "sell" ? "Sell" : variant === "team" ? "Bid for" : "Buy";

  if (variant === "team" && tradeSide === "buy") {
    return `${verb} ${sideLabel}`;
  }

  return `${verb} ${sideLabel}`;
}

export function deriveOutcomeSummaryLabel(tradeSide: BidTradeSide): string {
  return tradeSide === "sell" ? "Est. Proceeds" : "To Win";
}

/** Buy To Win includes the order cost (total payout if the outcome wins). */
export function deriveOutcomeSummaryValue(
  tradeSide: BidTradeSide,
  preview: OrderPreviewFields
): number {
  if (tradeSide === "sell") {
    return preview.potentialOutcome;
  }

  return preview.potentialPayout;
}

export function deriveAmountInputLabel(tradeSide: BidTradeSide): string {
  return tradeSide === "sell" ? "Shares" : "Amount";
}

export function resolveQuickAmountAllBalance(
  readiness: UserTradingReadiness | undefined,
  tradeSide: BidTradeSide
): number | undefined {
  if (!readiness?.balances) {
    return undefined;
  }

  if (tradeSide === "sell") {
    const shares = readiness.balances.conditionalTokenBalance;
    return shares !== undefined && shares > 0 ? shares : undefined;
  }

  const balance = readiness.balances.clobUsdcAvailable;
  return balance !== undefined && balance > 0 ? Math.floor(balance) : undefined;
}

export function getFirstFailedCheck(
  readiness: UserTradingReadiness | undefined
): AccountReadinessCheck | undefined {
  return readiness?.checks.find((check) => check.status === "fail");
}

export function formatReadinessFailureMessage(
  readiness: UserTradingReadiness | undefined
): string | undefined {
  const failed = getFirstFailedCheck(readiness);

  if (!failed) {
    return undefined;
  }

  return `${failed.label}: ${failed.detail}`;
}

export function canSubmitTradeTicket(input: {
  status: TradeTicketStatus;
  previewCanSubmit: boolean;
}): boolean {
  return (
    input.previewCanSubmit &&
    input.status !== "loading" &&
    input.status !== "signing" &&
    input.status !== "submitting"
  );
}

export interface TradingEligibilitySnapshot {
  status: TradingUserSession["eligibilityStatus"];
  checkedAt?: string;
  country?: string;
  region?: string;
  reason?: string;
}

function isGeoblockNetworkErrorMessage(text: string | undefined) {
  if (!text) {
    return false;
  }

  const normalized = text.toLowerCase();

  return (
    normalized.includes("timeout") ||
    normalized.includes("aborted") ||
    normalized.includes("fetch failed") ||
    normalized.includes("network") ||
    normalized.includes("econnrefused") ||
    normalized.includes("enotfound") ||
    normalized.includes("unreachable")
  );
}

export function isEligibilityNetworkFailure(
  readiness: UserTradingReadiness | undefined
): boolean {
  const eligibilityCheck = readiness?.checks.find(
    (check) => check.id === "eligibility"
  );

  if (eligibilityCheck?.status !== "fail") {
    return false;
  }

  return (
    isGeoblockNetworkErrorMessage(eligibilityCheck.detail) ||
    isGeoblockNetworkErrorMessage(readiness?.session?.eligibilityReason)
  );
}

export async function refreshTradingEligibility(): Promise<TradingEligibilitySnapshot> {
  const response = await fetchJson<{ eligibility: TradingEligibilitySnapshot }>(
    "/api/trading/eligibility"
  );

  return response.eligibility;
}

async function resolveOrderReadinessForBid(deps: {
  orderReadiness?: UserTradingReadiness;
}): Promise<UserTradingReadiness> {
  let orderReadiness =
    deps.orderReadiness ??
    (await fetchJson<UserTradingReadiness>("/api/trading/readiness"));

  if (!isEligibilityNetworkFailure(orderReadiness)) {
    return orderReadiness;
  }

  await refreshTradingEligibility();
  orderReadiness = await fetchJson<UserTradingReadiness>(
    "/api/trading/readiness"
  );

  return orderReadiness;
}

export async function ensureTradingReadyForBid(deps: {
  session?: TradingUserSession;
  authReadiness?: UserTradingReadiness;
  orderReadiness?: UserTradingReadiness;
  previewCanSubmit: boolean;
  previewDisabledReason?: string;
  openLogin: () => Promise<unknown>;
  signClobCredentials: () => Promise<void>;
  signTokenApprovals: () => Promise<void>;
  refreshSetupReadiness?: () => Promise<UserTradingReadiness | undefined>;
}): Promise<BidGateResult> {
  const setupReadiness = deps.authReadiness ?? deps.orderReadiness;
  const setupSteps = getTradingSetupSteps(setupReadiness);
  if (!deps.session) {
    await deps.openLogin();
    return {
      ok: false,
      action: "open_login",
      message: "Connect your wallet to continue."
    };
  }

  if (!setupSteps.walletDeployed) {
    await deps.openLogin();
    return {
      ok: false,
      action: "open_login",
      message: "Deploy your Polymarket deposit wallet to continue."
    };
  }

  if (!setupSteps.clobSigned) {
    await deps.signClobCredentials();
    await deps.refreshSetupReadiness?.();
    return {
      ok: false,
      action: "sign_clob",
      message:
        "Sign once to derive your user-specific Polymarket CLOB credentials."
    };
  }

  if (!setupSteps.tokensAuthorized) {
    await deps.signTokenApprovals();
    await deps.refreshSetupReadiness?.();
    return {
      ok: false,
      action: "sign_tokens",
      message: "Authorize token spending before placing orders."
    };
  }

  if (!deps.previewCanSubmit) {
    return {
      ok: false,
      action: "show_error",
      message:
        deps.previewDisabledReason ??
        "This market is not available for real orders."
    };
  }

  const orderReadiness = await resolveOrderReadinessForBid({
    orderReadiness: deps.orderReadiness
  });

  const eligibilityCheck = orderReadiness.checks.find(
    (check) => check.id === "eligibility"
  );

  if (eligibilityCheck?.status === "fail") {
    return {
      ok: false,
      action: isEligibilityNetworkFailure(orderReadiness)
        ? "retry_eligibility"
        : "show_error",
      message: eligibilityCheck.detail
    };
  }

  if (!isTradingSetupComplete(orderReadiness)) {
    if (!isSetupStepComplete(orderReadiness, "clob")) {
      await deps.signClobCredentials();
      await deps.refreshSetupReadiness?.();
      return {
        ok: false,
        action: "sign_clob",
        message: "Complete CLOB credential setup before submitting."
      };
    }

    if (!isSetupStepComplete(orderReadiness, "tokens")) {
      await deps.signTokenApprovals();
      await deps.refreshSetupReadiness?.();
      return {
        ok: false,
        action: "sign_tokens",
        message: "Complete token authorization before submitting."
      };
    }
  }

  if (!orderReadiness.ready) {
    return {
      ok: false,
      action: "show_error",
      message:
        formatReadinessFailureMessage(orderReadiness) ??
        "Trading account is not ready for this order."
    };
  }

  return { ok: true, readiness: orderReadiness };
}

export type SubmitOrderResult = {
  order?: UserOrderRecord;
  submittedAt?: string;
};

export async function submitSignedTradeOrder(input: {
  session: TradingUserSession;
  preview: BidOrderPreview;
  orderType: TradingOrderType;
  userOrderPreview: UserOrderPreview;
  signer?: WalletClient;
}): Promise<SubmitOrderResult> {
  if (!input.session.funderAddress || !input.preview.tokenId) {
    throw new Error(
      "A connected wallet, deployed deposit wallet, and Polymarket token are required."
    );
  }

  const signedOrder = await buildSdkSignedUserOrder({
    preview: input.preview,
    walletAddress: input.session.walletAddress,
    funderAddress: input.session.funderAddress,
    orderType: input.orderType,
    signer: input.signer,
  });

  return fetchJson<SubmitOrderResult>("/api/trading/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...signedOrder,
      preview: input.userOrderPreview
    })
  });
}

export function formatTeamDefaultLimitPriceString(
  snapshot: TeamMarketSnapshot,
  outcomeSide: OrderOutcomeSide,
  tradeSide: BidTradeSide
): string {
  return getTeamDefaultLimitPrice(snapshot, outcomeSide, tradeSide).toFixed(3);
}

export function formatGameDefaultLimitPriceString(
  gameSnapshot: GameMarketSnapshot,
  matchOutcomeSide: Parameters<typeof formatDefaultGameTradeLimitPrice>[1],
  binarySide: OrderOutcomeSide,
  tradeSide: BidTradeSide
): string {
  if (tradeSide === "sell") {
    return getGameDefaultLimitPrice(
      gameSnapshot,
      matchOutcomeSide,
      binarySide,
      tradeSide
    ).toFixed(3);
  }

  return formatDefaultGameTradeLimitPrice(
    gameSnapshot,
    matchOutcomeSide,
    binarySide,
    tradeSide
  );
}
