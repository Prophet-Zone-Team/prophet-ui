import { findGameMarketOutcome } from "@/lib/market/game-outcome-price";
import { formatDateTimeFromIso } from "@/lib/formatters/datetime";
import { buildGameBidOrderPreview, buildFixtureBidOrderPreview, getDefaultFixtureLimitPrice } from "@/lib/market/game-order";
import { isValidAskPrice } from "@/lib/market/fixture-ask-liquidity";
import {
  buildBidOrderPreview,
  type BidOrderPreview
} from "@/lib/market/polymarket-order";
import {
  calculateOrderEstimate,
  calculateReferencePrice,
  normalizeLimitPrice,
  roundBudgetDown
} from "@/lib/market/order-math";
import {
  formatDefaultGameTradeLimitPrice,
  getDefaultGameTradeLimitPrice,
  getDefaultTradeLimitPrice
} from "@/lib/market/trade-ticket";
import { buildSdkSignedUserOrder } from "@/lib/market/sdk-user-order";
import { resolveTradeTicketAvailableCash } from "@/lib/trading/cash-balance-model";
import {
  buildBalancesQuery,
  mergeTradingReadiness,
} from "@/lib/trading/merge-trading-readiness";
import {
  fetchTradingBalancesWithOnchain,
  fetchTradingReadinessWithOnchain,
  enrichSetupReadinessWithOnchain,
} from "@/lib/trading/trading-balances-client";
import { useAuthStore } from "@/store/auth-store";
import {
  formatEligibilityRestrictionDetail,
  formatRegionBlockedDetail,
} from "@/lib/trading/trading-eligibility-client";
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
  FixtureMarketOutcome,
  GameMarketSnapshot,
  MatchOutcomeSide,
  OrderOutcomeSide,
  TeamMarketSnapshot,
  PolymarketFeeDetails,
  TradingOrderType,
  TradingUserSession,
  UserOrderPreview,
  UserOrderRecord,
  UserPositionRecord,
  UserTradingBalancesResponse,
  UserTradingReadiness
} from "@/types/market";
import type { TradeOrderMode } from "@/views/trade/trade-widget/trade-market-button";
import type { LimitExpirationPreset, TradeTabId } from "@/store/trade-ticket-store";

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

export function resolveOrderType(
  orderMode: TradeOrderMode,
  expiration?: string
): TradingOrderType {
  if (orderMode === "market") {
    return "FAK";
  }

  if (expiration && expiration !== "0") {
    return "GTD";
  }

  return "GTC";
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
  tradeSide: BidTradeSide,
  liveBookPrice?: number
): number {
  const yesToken = snapshot.market.polymarket?.tokens.yes;
  const noToken = snapshot.market.polymarket?.tokens.no;
  const yesPrice =
    yesToken?.price ?? calculateReferencePrice(snapshot.market.probability, "yes");
  const noPrice =
    noToken?.price ?? calculateReferencePrice(snapshot.market.probability, "no");
  const sidePrice = outcomeSide === "yes" ? yesPrice : noPrice;

  if (tradeSide === "sell") {
    const token = outcomeSide === "yes" ? yesToken : noToken;
    const bookBid = liveBookPrice ?? token?.bestBid;

    if (bookBid !== undefined && bookBid > 0) {
      return bookBid;
    }

    return sidePrice;
  }

  return getDefaultTradeLimitPrice(snapshot, outcomeSide);
}

export function resolveTeamDefaultLimitPrice(
  snapshot: TeamMarketSnapshot,
  outcomeSide: OrderOutcomeSide,
  tradeSide: BidTradeSide,
  liveBook?: { bestBid?: number; bestAsk?: number }
): number {
  if (tradeSide === "sell" && isValidAskPrice(liveBook?.bestBid)) {
    return liveBook!.bestBid!;
  }

  if (tradeSide === "buy" && isValidAskPrice(liveBook?.bestAsk)) {
    return liveBook!.bestAsk!;
  }

  return getTeamDefaultLimitPrice(snapshot, outcomeSide, tradeSide);
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

export function resolveGameDefaultLimitPrice(
  gameSnapshot: GameMarketSnapshot,
  matchOutcomeSide: Parameters<typeof getDefaultGameTradeLimitPrice>[1],
  binarySide: OrderOutcomeSide,
  tradeSide: BidTradeSide,
  fixtureOutcome?: FixtureMarketOutcome | null,
  liveBook?: { bestBid?: number; bestAsk?: number }
): number {
  if (fixtureOutcome) {
    const fixturePrice = getDefaultFixtureLimitPrice(
      fixtureOutcome,
      binarySide,
      tradeSide
    );

    if (fixturePrice !== undefined) {
      if (tradeSide === "sell" && isValidAskPrice(liveBook?.bestBid)) {
        return liveBook!.bestBid!;
      }

      if (tradeSide === "buy" && isValidAskPrice(liveBook?.bestAsk)) {
        return liveBook!.bestAsk!;
      }

      return fixturePrice;
    }
  }

  if (tradeSide === "sell" && isValidAskPrice(liveBook?.bestBid)) {
    return liveBook!.bestBid!;
  }

  if (tradeSide === "buy" && isValidAskPrice(liveBook?.bestAsk)) {
    return liveBook!.bestAsk!;
  }

  return getGameDefaultLimitPrice(
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
  tokenId?: string;
  maxShareSize?: number;
  acceptingOrders?: boolean;
}): BidOrderPreview {
  return buildBidOrderPreview({
    snapshot: input.snapshot,
    outcomeSide: input.outcomeSide,
    tradeSide: input.tradeSide,
    amount: input.amount,
    limitPrice: input.limitPrice,
    orderType: input.orderType,
    tokenId: input.tokenId,
    maxShareSize: input.maxShareSize,
    acceptingOrders: input.acceptingOrders
  });
}

const marketStatusInflight = new Map<
  string,
  Promise<boolean | undefined>
>();

export async function fetchMarketAcceptingOrders(input: {
  slug?: string;
  conditionId?: string;
}): Promise<boolean | undefined> {
  const query = new URLSearchParams();

  if (input.conditionId) {
    query.set("conditionId", input.conditionId);
  } else if (input.slug) {
    query.set("slug", input.slug);
  } else {
    return undefined;
  }

  const cacheKey = query.toString();
  const inflight = marketStatusInflight.get(cacheKey);

  if (inflight) {
    return inflight;
  }

  const request = fetchJson<{ acceptingOrders?: boolean }>(
    `/api/trading/market-status?${cacheKey}`
  )
    .then((payload) => payload.acceptingOrders)
    .finally(() => {
      marketStatusInflight.delete(cacheKey);
    });

  marketStatusInflight.set(cacheKey, request);
  return request;
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
  fixtureOutcome?: FixtureMarketOutcome | null;
}): ReturnType<typeof buildGameBidOrderPreview> {
  if (input.fixtureOutcome) {
    return buildFixtureBidOrderPreview({
      outcome: input.fixtureOutcome,
      acceptingOrders:
        input.fixtureOutcome.acceptingOrders ??
        input.gameSnapshot.market.acceptingOrders,
      closed: input.gameSnapshot.market.closed,
      match: input.gameSnapshot.match,
      binarySide: input.binarySide,
      tradeSide: input.tradeSide,
      amount: input.amount,
      limitPrice: input.limitPrice,
      orderType: input.orderType
    });
  }

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

export async function fetchConditionalTokenBalance(
  tokenId: string
): Promise<number | undefined> {
  const query = buildBalancesQuery({
    tradeSide: "sell",
    tokenId,
    cost: 0.01,
    size: 0.01,
    totalCost: 0.01,
    estimatedTakerFee: 0,
  });

  const session = useAuthStore.getState().session;
  const balances = await fetchTradingBalancesWithOnchain(
    session,
    `/api/trading/balances?${query}`,
    { fundingQuery: query },
  );

  return balances.balances?.conditionalTokenBalance;
}

const PREVIEW_BALANCES_CACHE_MS = 5_000;

const previewBalancesInflight = new Map<
  string,
  Promise<UserTradingBalancesResponse>
>();
const previewBalancesResolvedCache = new Map<
  string,
  { expiresAt: number; value: UserTradingBalancesResponse }
>();

export function buildPreviewBalancesQueryKey(
  preview: Pick<
    OrderPreviewFields,
    | "tokenId"
    | "estimatedCost"
    | "estimatedTakerFee"
    | "estimatedTotalCost"
    | "shareSize"
  >,
  tradeSide: BidTradeSide
): string | null {
  if (!preview.tokenId) {
    return null;
  }

  return buildBalancesQuery({
    tradeSide,
    tokenId: preview.tokenId,
    cost: preview.estimatedCost,
    size: preview.shareSize,
    totalCost: preview.estimatedTotalCost,
    estimatedTakerFee: preview.estimatedTakerFee,
  });
}

function fetchPreviewBalances(
  query: string,
  options?: { force?: boolean }
): Promise<UserTradingBalancesResponse> {
  if (!options?.force) {
    const cached = previewBalancesResolvedCache.get(query);

    if (cached && cached.expiresAt > Date.now()) {
      return Promise.resolve(cached.value);
    }

    const inflight = previewBalancesInflight.get(query);

    if (inflight) {
      return inflight;
    }
  } else {
    previewBalancesResolvedCache.delete(query);
  }

  const session = useAuthStore.getState().session;
  const request = fetchTradingBalancesWithOnchain(
    session,
    `/api/trading/balances?${query}`,
    { fundingQuery: query },
  )
    .then((response) => {
      previewBalancesResolvedCache.set(query, {
        expiresAt: Date.now() + PREVIEW_BALANCES_CACHE_MS,
        value: response,
      });
      return response;
    })
    .finally(() => {
      previewBalancesInflight.delete(query);
    });

  previewBalancesInflight.set(query, request);
  return request;
}

export async function fetchReadinessForPreview(
  preview: OrderPreviewFields,
  tradeSide: BidTradeSide,
  setupReadiness?: UserTradingReadiness,
  options?: { force?: boolean }
): Promise<UserTradingReadiness> {
  const query = buildPreviewBalancesQueryKey(preview, tradeSide);

  if (!query) {
    throw new Error("Order preview token id is required.");
  }

  const [setup, balances] = await Promise.all([
    setupReadiness
      ? enrichSetupReadinessWithOnchain(setupReadiness)
      : fetchTradingReadinessWithOnchain(),
    fetchPreviewBalances(query, options),
  ]);

  return mergeTradingReadiness(setup, balances, { tradeSide });
}

export async function fetchTokenBestAsk(
  tokenId: string
): Promise<number | undefined> {
  const payload = await fetchJson<{
    orderbook: { asks: Array<{ price: number }> };
  }>(`/api/market/orderbook?tokenId=${encodeURIComponent(tokenId)}`);

  const ask = payload.orderbook.asks[0]?.price;

  return ask !== undefined && ask > 0 && ask < 1 ? ask : undefined;
}

export async function fetchFixtureLiveAsks(
  outcome: Pick<FixtureMarketOutcome, "tokenId" | "noTokenId">
): Promise<{ yesAsk?: number; noAsk?: number }> {
  const [yesAsk, noAsk] = await Promise.all([
    outcome.tokenId
      ? fetchTokenBestAsk(outcome.tokenId)
      : Promise.resolve(undefined),
    outcome.noTokenId
      ? fetchTokenBestAsk(outcome.noTokenId)
      : Promise.resolve(undefined),
  ]);

  return { yesAsk, noAsk };
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
  preview: ReturnType<typeof buildGameBidOrderPreview>,
  fixtureOutcome?: FixtureMarketOutcome | null
): UserOrderPreview {
  if (!preview.tokenId) {
    throw new Error("A Polymarket token ID is required before submitting.");
  }

  return {
    marketId:
      fixtureOutcome?.conditionId ??
      gameSnapshot.match.polymarket?.moneyline.conditionId,
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
  return tradeSide === "sell" ? "You will receive" : "To Win";
}

/** Estimated total payout if the selected outcome wins, including cost. */
export function deriveOutcomeSummaryValue(
  tradeSide: BidTradeSide,
  preview: OrderPreviewFields
): number {
  return tradeSide === "buy" ? preview.potentialOutcome : preview.potentialPayout;
}

export function deriveAmountInputLabel(
  orderMode: TradeOrderMode,
  tradeSide: BidTradeSide
): string {
  if (orderMode === "limit" || tradeSide === "sell") {
    return "Shares";
  }

  return "Value";
}

export function deriveLimitBuyTotal(preview: OrderPreviewFields): number {
  return preview.estimatedCost;
}

export const LIMIT_EXPIRATION_OPTIONS: {
  id: LimitExpirationPreset;
  label: string;
}[] = [
  { id: "never", label: "Never" },
  { id: "5m", label: "5 min" },
  { id: "1h", label: "1 hour" },
  { id: "12h", label: "12 hours" },
  { id: "24h", label: "24 hours" },
  { id: "end_of_day", label: "End of day" },
  { id: "custom", label: "Custom" }
];

export function getLimitExpirationLabel(
  preset: LimitExpirationPreset,
  customDate?: string
): string {
  if (preset === "custom" && customDate) {
    return formatDateTimeFromIso(customDate);
  }

  return (
    LIMIT_EXPIRATION_OPTIONS.find((option) => option.id === preset)?.label ??
    "Never"
  );
}

const GTD_SECURITY_THRESHOLD_SECONDS = 60;

export function resolveLimitExpirationTimestamp(
  preset: LimitExpirationPreset,
  customDate?: string,
  now = new Date()
): string {
  if (preset === "never") {
    return "0";
  }

  const nowSeconds = Math.floor(now.getTime() / 1000);
  const minimumExpiration = nowSeconds + GTD_SECURITY_THRESHOLD_SECONDS;
  let expirationSeconds: number | undefined;

  switch (preset) {
    case "5m":
      expirationSeconds =
        nowSeconds + GTD_SECURITY_THRESHOLD_SECONDS + 5 * 60;
      break;
    case "1h":
      expirationSeconds =
        nowSeconds + GTD_SECURITY_THRESHOLD_SECONDS + 60 * 60;
      break;
    case "12h":
      expirationSeconds =
        nowSeconds + GTD_SECURITY_THRESHOLD_SECONDS + 12 * 60 * 60;
      break;
    case "24h":
      expirationSeconds =
        nowSeconds + GTD_SECURITY_THRESHOLD_SECONDS + 24 * 60 * 60;
      break;
    case "end_of_day": {
      const expirationDate = new Date(now);
      expirationDate.setHours(23, 59, 59, 999);
      expirationSeconds = Math.floor(expirationDate.getTime() / 1000);
      break;
    }
    case "custom": {
      if (!customDate) {
        return "0";
      }

      const expirationDate = new Date(customDate);

      if (
        Number.isNaN(expirationDate.getTime()) ||
        expirationDate.getTime() <= now.getTime()
      ) {
        return "0";
      }

      expirationSeconds = Math.floor(expirationDate.getTime() / 1000);
      break;
    }
    default:
      return "0";
  }

  if (expirationSeconds === undefined) {
    return "0";
  }

  return String(Math.max(expirationSeconds, minimumExpiration));
}

export function validateLimitExpirationCustom(
  customDate: string | undefined,
  now = new Date()
): string | undefined {
  if (!customDate) {
    return "Select a custom expiration date and time.";
  }

  const expirationDate = new Date(customDate);

  if (Number.isNaN(expirationDate.getTime())) {
    return "Custom expiration date is invalid.";
  }

  if (expirationDate.getTime() <= now.getTime()) {
    return "Custom expiration must be in the future.";
  }

  return undefined;
}

export function resolveLimitShareQuickAmount(
  currentAmount: string,
  delta: number
): string {
  const current = parseOrderAmount(currentAmount);
  const next = Math.max(0, Math.round((current + delta) * 10000) / 10000);

  return String(next);
}

export function resolveDefaultTradeAmount(orderMode: TradeOrderMode): string {
  return orderMode === "limit" ? "5" : "1";
}

export interface OutcomeShareMap {
  yes: number;
  no: number;
}

export interface MarketOutcomeTokenIds {
  yesTokenId?: string;
  noTokenId?: string;
  conditionId?: string;
}

export function resolveTeamOutcomeTokenIds(
  snapshot: TeamMarketSnapshot
): MarketOutcomeTokenIds {
  const polymarket = snapshot.market.polymarket;

  return {
    yesTokenId: polymarket?.tokens.yes?.tokenId,
    noTokenId: polymarket?.tokens.no?.tokenId,
    conditionId: polymarket?.conditionId ?? polymarket?.marketId
  };
}

export function resolveGameOutcomeTokenIds(
  gameSnapshot: GameMarketSnapshot,
  matchOutcomeSide: MatchOutcomeSide,
  fixtureOutcome?: FixtureMarketOutcome | null
): MarketOutcomeTokenIds {
  if (fixtureOutcome) {
    return {
      yesTokenId: fixtureOutcome.tokenId,
      noTokenId: fixtureOutcome.noTokenId,
      conditionId: fixtureOutcome.conditionId
    };
  }

  const outcome = findGameMarketOutcome(
    gameSnapshot.outcomes,
    matchOutcomeSide
  );

  return {
    yesTokenId: outcome?.tokenId,
    noTokenId: outcome?.noTokenId,
    conditionId: gameSnapshot.match.polymarket?.moneyline.conditionId
  };
}

export function buildOutcomeShareMap(
  positions: UserPositionRecord[],
  yesTokenId?: string,
  noTokenId?: string
): OutcomeShareMap {
  let yes = 0;
  let no = 0;

  for (const position of positions) {
    if (yesTokenId && position.asset === yesTokenId) {
      yes = position.size;
    } else if (noTokenId && position.asset === noTokenId) {
      no = position.size;
    }
  }

  return { yes, no };
}

export async function fetchMarketOutcomeShares(
  conditionId: string | undefined
): Promise<UserPositionRecord[]> {
  if (!conditionId) {
    return [];
  }

  const payload = await fetchJson<{
    positions?: UserPositionRecord[];
    error?: string;
  }>(
    `/api/trading/positions?market=${encodeURIComponent(conditionId)}&limit=10`
  );

  if (payload.error) {
    throw new Error(payload.error);
  }

  return payload.positions ?? [];
}

export type SellQuickAmountFraction = 0.25 | 0.5 | 0.75 | "max";

export function resolveSellQuickAmount(
  availableShares: number | undefined,
  fraction: SellQuickAmountFraction
): string | undefined {
  if (availableShares === undefined || availableShares <= 0) {
    return undefined;
  }

  if (fraction === "max") {
    return String(Math.floor(availableShares * 10000) / 10000);
  }

  const amount = Math.floor(availableShares * fraction * 10000) / 10000;

  return amount > 0 ? String(amount) : undefined;
}

export type SellQuickAmountButtonValue = 0.25 | 0.5 | 0.75 | "all";

const SELL_QUICK_AMOUNT_BUTTON_FRACTIONS: Array<{
  value: SellQuickAmountButtonValue;
  fraction: SellQuickAmountFraction;
}> = [
  { value: 0.25, fraction: 0.25 },
  { value: 0.5, fraction: 0.5 },
  { value: 0.75, fraction: 0.75 },
  { value: "all", fraction: "max" }
];

export function resolveSelectedSellQuickAmount(
  availableShares: number | undefined,
  amount: string
): SellQuickAmountButtonValue | undefined {
  if (availableShares === undefined || availableShares <= 0) {
    return undefined;
  }

  const current = parseOrderAmount(amount);

  if (current <= 0) {
    return undefined;
  }

  for (const { value, fraction } of SELL_QUICK_AMOUNT_BUTTON_FRACTIONS) {
    const resolved = resolveSellQuickAmount(availableShares, fraction);

    if (resolved && parseOrderAmount(resolved) === current) {
      return value;
    }
  }

  return undefined;
}

export function resolveQuickAmountAllBalance(
  readiness: UserTradingReadiness | undefined,
  tradeSide: BidTradeSide,
  availableShares?: number
): number | undefined {
  if (tradeSide === "sell") {
    if (availableShares !== undefined && availableShares > 0) {
      return availableShares;
    }

    const shares = readiness?.balances?.conditionalTokenBalance;
    return shares !== undefined && shares > 0 ? shares : undefined;
  }

  if (!readiness?.balances) {
    return undefined;
  }

  const balance =
    readiness.balances.clobUsdcAvailable ?? readiness.balances.usdcAvailable;
  return balance !== undefined && balance > 0 ? balance : undefined;
}

const MARKET_BUY_ALL_IN_STEP = 0.0001;

export function resolveMarketBuyAllInAmount(input: {
  availableCash: number;
  sidePrice: number;
  fee?: PolymarketFeeDetails;
}): number {
  if (!Number.isFinite(input.availableCash) || input.availableCash <= 0) {
    return 0;
  }

  if (!Number.isFinite(input.sidePrice) || input.sidePrice <= 0) {
    return 0;
  }

  let budget = roundBudgetDown(input.availableCash);

  while (budget > 0) {
    const estimate = calculateOrderEstimate({
      side: "yes",
      tradeSide: "buy",
      amount: budget,
      probability: input.sidePrice * 100,
      limitPrice: input.sidePrice,
      orderType: "FAK",
      fee: input.fee
    });

    if (estimate.estimatedTotalCost <= input.availableCash + Number.EPSILON) {
      return budget;
    }

    budget = roundBudgetDown(budget - MARKET_BUY_ALL_IN_STEP);
  }

  return 0;
}

export function formatMarketBuyAmountInput(value: number): string {
  const normalized = roundBudgetDown(value);

  if (!Number.isFinite(normalized) || normalized <= 0) {
    return "0";
  }

  return String(normalized);
}

export function getFirstFailedCheck(
  readiness: UserTradingReadiness | undefined
): AccountReadinessCheck | undefined {
  return readiness?.checks.find((check) => check.status === "fail");
}

export function getFirstBlockingCheck(
  readiness: UserTradingReadiness | undefined
): AccountReadinessCheck | undefined {
  return readiness?.checks.find((check) => check.status !== "pass");
}

export function formatReadinessFailureMessage(
  readiness: UserTradingReadiness | undefined
): string | undefined {
  const blocking = getFirstBlockingCheck(readiness);

  if (!blocking) {
    return undefined;
  }

  return `${blocking.label}: ${blocking.detail}`;
}

export const INSUFFICIENT_FUNDS_MESSAGE = "Insufficient funds";

export function isBuyInsufficientFunds(input: {
  tradeSide: BidTradeSide;
  preview: Pick<OrderPreviewFields, "estimatedTotalCost">;
  readiness: UserTradingReadiness | undefined;
}): boolean {
  if (input.tradeSide !== "buy") {
    return false;
  }

  const required = input.preview.estimatedTotalCost;

  if (!Number.isFinite(required) || required <= 0) {
    return false;
  }

  const balanceCheck = input.readiness?.checks?.find(
    (check) => check.id === "balance"
  );

  if (balanceCheck?.status === "fail") {
    return true;
  }

  if (balanceCheck?.status === "pass") {
    return false;
  }

  const available =
    resolveTradeTicketAvailableCash(input.readiness) ??
    input.readiness?.balances?.usdcAvailable;

  return available !== undefined && available < required;
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
  session: TradingUserSession | undefined
): boolean {
  if (session?.eligibilityStatus !== "error") {
    return false;
  }

  return isGeoblockNetworkErrorMessage(session.eligibilityReason);
}

export async function refreshTradingEligibility(): Promise<TradingEligibilitySnapshot> {
  const response = await fetchJson<{ eligibility: TradingEligibilitySnapshot }>(
    "/api/trading/eligibility"
  );

  return response.eligibility;
}

export async function ensureTradingReadyForBid(deps: {
  session?: TradingUserSession;
  authReadiness?: UserTradingReadiness;
  orderReadiness?: UserTradingReadiness;
  previewCanSubmit: boolean;
  previewDisabledReason?: string;
  tradeSide?: BidTradeSide;
  isBuyRestricted?: boolean;
  isRegionFullyBlocked?: boolean;
  openLogin: () => Promise<unknown>;
  signClobCredentials: () => Promise<void>;
  signTokenApprovals: () => Promise<void>;
  refreshSetupReadiness?: () => Promise<UserTradingReadiness | undefined>;
  /** Skip order funding/balance readiness; use for combo cashout RFQ accept. */
  skipFundingReadiness?: boolean;
}): Promise<BidGateResult> {
  const tradeSide = deps.tradeSide ?? "buy";
  const eligibilityView = deps.session
    ? {
        status: deps.session.eligibilityStatus,
        checkedAt: deps.session.eligibilityCheckedAt,
        country: deps.session.eligibilityCountry,
        region: deps.session.eligibilityRegion,
        reason: deps.session.eligibilityReason,
      }
    : undefined;
  const isEligibilityBlocked =
    tradeSide === "buy"
      ? Boolean(deps.isBuyRestricted)
      : Boolean(deps.isRegionFullyBlocked);

  if (isEligibilityBlocked) {
    return {
      ok: false,
      action: "show_error",
      message:
        tradeSide === "buy"
          ? formatEligibilityRestrictionDetail(eligibilityView)
          : formatRegionBlockedDetail(eligibilityView),
    };
  }

  if (isEligibilityNetworkFailure(deps.session)) {
    return {
      ok: false,
      action: "retry_eligibility",
      message:
        deps.session?.eligibilityReason ??
        "Polymarket geoblock check timed out or is unreachable. Retry the eligibility check.",
    };
  }
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

  const orderReadiness = deps.orderReadiness;

  if (!orderReadiness) {
    return {
      ok: false,
      action: "show_error",
      message: "Order readiness is unavailable. Refresh and try again.",
    };
  }

  if (!isTradingSetupComplete(setupReadiness)) {
    if (!isSetupStepComplete(setupReadiness, "clob")) {
      await deps.signClobCredentials();
      await deps.refreshSetupReadiness?.();
      return {
        ok: false,
        action: "sign_clob",
        message: "Complete CLOB credential setup before submitting."
      };
    }

    if (!isSetupStepComplete(setupReadiness, "tokens")) {
      await deps.signTokenApprovals();
      await deps.refreshSetupReadiness?.();
      return {
        ok: false,
        action: "sign_tokens",
        message: "Complete token authorization before submitting."
      };
    }
  }

  if (!deps.skipFundingReadiness && !orderReadiness.ready) {
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
  response?: unknown;
  order?: UserOrderRecord;
  submittedAt?: string;
};

export type SubmitBatchOrderResultItem = {
  index: number;
  success: boolean;
  order?: UserOrderRecord;
  error?: string;
  response?: unknown;
};

export type SubmitBatchOrderResult = {
  results: SubmitBatchOrderResultItem[];
  successCount: number;
  failureCount: number;
  submittedAt?: string;
};

export async function submitSignedTradeOrdersBatch(input: {
  orders: Array<{
    signedOrder: Awaited<ReturnType<typeof buildSdkSignedUserOrder>>;
    userOrderPreview: UserOrderPreview;
  }>;
}): Promise<SubmitBatchOrderResult> {
  if (input.orders.length === 0) {
    throw new Error("At least one signed order is required.");
  }

  return fetchJson<SubmitBatchOrderResult>("/api/trading/orders/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orders: input.orders.map(({ signedOrder, userOrderPreview }) => ({
        ...signedOrder,
        preview: userOrderPreview
      }))
    })
  });
}

export async function submitSignedTradeOrder(input: {
  session: TradingUserSession;
  preview: BidOrderPreview;
  orderType: TradingOrderType;
  userOrderPreview: UserOrderPreview;
  expiration?: string;
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
    expiration: input.expiration,
    signer: input.signer
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

export function resolveTakeProfitLimitPrice(
  takeProfitLimitPrice: string,
  purchasePrice: number
): number {
  return normalizeLimitPrice(
    parseLimitPriceInput(takeProfitLimitPrice, purchasePrice)
  );
}

export function buildTakeProfitSellPreview(
  input:
    | {
        variant: "team";
        snapshot: TeamMarketSnapshot;
        outcomeSide: OrderOutcomeSide;
        shareSize: number;
        limitPrice: number;
        tokenId: string;
        maxShareSize?: number;
        acceptingOrders?: boolean;
      }
    | {
        variant: "game";
        gameSnapshot: GameMarketSnapshot;
        matchOutcomeSide: MatchOutcomeSide;
        outcomeSide: OrderOutcomeSide;
        shareSize: number;
        limitPrice: number;
        tokenId: string;
        fixtureOutcome?: FixtureMarketOutcome | null;
        maxShareSize?: number;
      }
): BidOrderPreview {
  if (input.variant === "team") {
    return buildTeamTradePreview({
      snapshot: input.snapshot,
      outcomeSide: input.outcomeSide,
      tradeSide: "sell",
      amount: input.shareSize,
      limitPrice: input.limitPrice,
      orderType: "GTC",
      tokenId: input.tokenId,
      maxShareSize: input.maxShareSize,
      acceptingOrders: input.acceptingOrders
    });
  }

  return toBidOrderPreview(
    buildGameTradePreview({
      gameSnapshot: input.gameSnapshot,
      matchOutcomeSide: input.matchOutcomeSide,
      binarySide: input.outcomeSide,
      tradeSide: "sell",
      amount: input.shareSize,
      limitPrice: input.limitPrice,
      orderType: "GTC",
      fixtureOutcome: input.fixtureOutcome
    })
  );
}

export function buildTakeProfitOrderBundle(
  input:
    | {
        variant: "team";
        snapshot: TeamMarketSnapshot;
        outcomeSide: OrderOutcomeSide;
        shareSize: number;
        limitPrice: number;
        tokenId: string;
        maxShareSize?: number;
        acceptingOrders?: boolean;
      }
    | {
        variant: "game";
        gameSnapshot: GameMarketSnapshot;
        matchOutcomeSide: MatchOutcomeSide;
        outcomeSide: OrderOutcomeSide;
        shareSize: number;
        limitPrice: number;
        tokenId: string;
        fixtureOutcome?: FixtureMarketOutcome | null;
        maxShareSize?: number;
      }
): { bidPreview: BidOrderPreview; userPreview: UserOrderPreview } {
  if (input.variant === "team") {
    const bidPreview = buildTakeProfitSellPreview(input);

    return {
      bidPreview,
      userPreview: buildTeamUserOrderPreview(input.snapshot, bidPreview)
    };
  }

  const gamePreview = buildGameTradePreview({
    gameSnapshot: input.gameSnapshot,
    matchOutcomeSide: input.matchOutcomeSide,
    binarySide: input.outcomeSide,
    tradeSide: "sell",
    amount: input.shareSize,
    limitPrice: input.limitPrice,
    orderType: "GTC",
    fixtureOutcome: input.fixtureOutcome
  });

  return {
    bidPreview: toBidOrderPreview(gamePreview),
    userPreview: buildGameUserOrderPreview(
      input.gameSnapshot,
      gamePreview,
      input.fixtureOutcome
    )
  };
}

export async function submitTakeProfitLimitOrder(input: {
  session: TradingUserSession;
  preview: BidOrderPreview;
  userOrderPreview: UserOrderPreview;
  signer?: WalletClient;
}): Promise<SubmitOrderResult> {
  return submitSignedTradeOrder({
    session: input.session,
    preview: input.preview,
    orderType: "GTC",
    userOrderPreview: input.userOrderPreview,
    signer: input.signer
  });
}
