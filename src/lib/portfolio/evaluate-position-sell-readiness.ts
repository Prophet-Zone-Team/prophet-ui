import { getDefaultFixtureLimitPrice } from "@/lib/market/game-order";
import { resolveMaxSellShares } from "@/lib/market/order-math";
import type { PositionGameSellContext } from "@/lib/portfolio/resolve-position-game-sell-context";
import { resolveOutcomeSideForPosition } from "@/lib/portfolio/portfolio-metrics";
import {
  resolveTradePrimaryAction,
  type TradePrimaryActionKind,
} from "@/lib/trading/trade-primary-action";
import type {
  TeamMarketSnapshot,
  TradingUserSession,
  UserPositionRecord,
  UserTradingReadiness,
} from "@/types/market";
import {
  buildGameTradePreview,
  buildTeamTradePreview,
  deriveTradeActionLabel,
  fetchMarketAcceptingOrders,
  fetchReadinessForPreview,
  getGameDefaultLimitPrice,
  getTeamDefaultLimitPrice,
  isEligibilityNetworkFailure,
  resolveOrderType,
  toBidOrderPreview,
} from "@/views/trade/trade-widget/trade-ticket-helpers";

const BLOCKED_SELL_ACTION_KINDS = new Set<TradePrimaryActionKind>([
  "market_blocked",
  "eligibility_blocked",
]);

export interface EvaluatePositionSellReadinessInput {
  position: UserPositionRecord;
  authReadiness?: UserTradingReadiness;
  session?: TradingUserSession;
  isAuthenticated: boolean;
  isRegionBlocked: boolean;
  isBuyRestricted: boolean;
  isRegionCloseOnly: boolean;
}

export interface EvaluatePositionSellReadinessResult {
  ok: boolean;
  message?: string;
}

export async function evaluateTeamPositionSellReadiness(
  snapshot: TeamMarketSnapshot,
  input: EvaluatePositionSellReadinessInput
): Promise<EvaluatePositionSellReadinessResult> {
  const { position } = input;
  const outcomeSide = resolveOutcomeSideForPosition(position, snapshot);
  const amount = resolveMaxSellShares(position.size) ?? position.size;
  const acceptingOrders = await fetchMarketAcceptingOrders({
    slug: position.slug,
    conditionId: position.conditionId,
  });
  const preview = buildTeamTradePreview({
    snapshot,
    outcomeSide,
    tradeSide: "sell",
    amount,
    limitPrice: getTeamDefaultLimitPrice(snapshot, outcomeSide, "sell"),
    orderType: resolveOrderType("market"),
    tokenId: position.asset,
    maxShareSize: position.size,
    acceptingOrders,
  });

  return evaluateSellPreviewReadiness(preview, input);
}

export async function evaluateGamePositionSellReadiness(
  context: PositionGameSellContext,
  input: EvaluatePositionSellReadinessInput
): Promise<EvaluatePositionSellReadinessResult> {
  const { position } = input;
  const {
    gameSnapshot,
    matchOutcomeSide,
    fixtureOutcome,
    outcomeSide,
  } = context;
  const amount = resolveMaxSellShares(position.size) ?? position.size;
  const defaultLimit = fixtureOutcome
    ? (getDefaultFixtureLimitPrice(fixtureOutcome, outcomeSide, "sell") ?? 0)
    : getGameDefaultLimitPrice(
        gameSnapshot,
        matchOutcomeSide,
        outcomeSide,
        "sell"
      );
  const gamePreview = buildGameTradePreview({
    gameSnapshot,
    matchOutcomeSide,
    binarySide: outcomeSide,
    tradeSide: "sell",
    amount,
    limitPrice: defaultLimit,
    orderType: resolveOrderType("market"),
    fixtureOutcome,
  });
  const preview = toBidOrderPreview(gamePreview);

  return evaluateSellPreviewReadiness(preview, input);
}

async function evaluateSellPreviewReadiness(
  preview: Parameters<typeof fetchReadinessForPreview>[0],
  input: EvaluatePositionSellReadinessInput
): Promise<EvaluatePositionSellReadinessResult> {
  let readiness: UserTradingReadiness;

  try {
    readiness = await fetchReadinessForPreview(
      preview,
      "sell",
      input.authReadiness
    );
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Order readiness is unavailable. Refresh and try again.",
    };
  }

  const primaryAction = resolveTradePrimaryAction({
    isAuthenticated: input.isAuthenticated,
    session: input.session,
    orderReadiness: readiness,
    authReadiness: input.authReadiness,
    tradeSide: "sell",
    submitLabel: deriveTradeActionLabel("sell", "yes", "team"),
    previewCanSubmit: preview.canSubmitRealOrder ?? false,
    previewDisabledReason: preview.disabledReason,
    isBuyRestricted: input.isBuyRestricted,
    isRegionFullyBlocked: input.isRegionBlocked,
    isRegionCloseOnly: input.isRegionCloseOnly,
    eligibilityNetworkError: isEligibilityNetworkFailure(input.session),
  });

  if (BLOCKED_SELL_ACTION_KINDS.has(primaryAction.kind)) {
    return {
      ok: false,
      message:
        primaryAction.hint ??
        "This position is not available to sell right now.",
    };
  }

  return { ok: true };
}

export function evaluatePositionRedeemReadiness(input: {
  session?: TradingUserSession;
  readiness?: UserTradingReadiness;
}): EvaluatePositionSellReadinessResult {
  if (!input.session?.walletAddress) {
    return {
      ok: false,
      message: "Connect your wallet to redeem this position.",
    };
  }

  if (input.readiness?.session?.depositWalletStatus !== "deployed") {
    return {
      ok: false,
      message: "Deploy your Polymarket deposit wallet to continue.",
    };
  }

  return { ok: true };
}
