import "server-only";

import type { ApiKeyCreds, BalanceAllowanceResponse, MarketDetails } from "@polymarket/clob-client-v2";

import { estimateBuyTakerFee as estimatePolymarketBuyTakerFee } from "../../lib/market/polymarketFees";
import type { BidTradeSide, TradingUserSession, UserBalanceSnapshot } from "../../types/market";
import { getBuilderTakerFeeRate } from "./builderCode";
import { fetchClobMarketDetails, fetchUserBalanceAllowance } from "./clobUserClient";

export interface OrderFundingRequirement {
  tradeSide: BidTradeSide;
  cost: number;
  size: number;
  totalCost?: number;
  estimatedTakerFee?: number;
}

export interface OrderFundingCheck {
  balance: "pass" | "fail" | "unknown";
  allowance: "pass" | "fail" | "unknown";
  balanceDetail: string;
  allowanceDetail: string;
}

export interface SignedOrderContext {
  maker: string;
  signer: string;
  taker?: string;
  tokenId: string;
  side: "BUY" | "SELL";
  signatureType: number;
  makerAmount: number;
  takerAmount: number;
  builder: string;
  signature: string;
}

export async function fetchUserBalanceSnapshot({
  session,
  credentials,
  tokenId,
}: {
  session: TradingUserSession;
  credentials: ApiKeyCreds;
  tokenId?: string;
}): Promise<UserBalanceSnapshot> {
  try {
    const result = await fetchUserBalanceAllowance({
      address: session.walletAddress,
      credentials,
      signatureType: session.signatureType,
      tokenId,
    });

    return toBalanceSnapshot({
      session,
      collateral: result.collateral,
      conditional: result.conditional,
    });
  } catch (error) {
    return {
      walletAddress: session.walletAddress,
      funderAddress: session.funderAddress,
      updatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function resolveOrderFundingRequirementWithFees(
  requirement: OrderFundingRequirement,
  tokenId: string,
): Promise<OrderFundingRequirement> {
  if (requirement.tradeSide !== "buy") {
    return requirement;
  }

  try {
    const [market, builderTakerFeeRate] = await Promise.all([
      fetchClobMarketDetails(tokenId),
      getBuilderTakerFeeRate(),
    ]);
    const estimatedTakerFee = estimateFundingBuyTakerFee({
      cost: requirement.cost,
      price: requirement.cost / requirement.size,
      market,
      builderTakerFeeRate,
    });

    return {
      ...requirement,
      estimatedTakerFee,
      totalCost: roundMoney(requirement.cost + estimatedTakerFee),
    };
  } catch {
    return requirement;
  }
}

export function toBalanceSnapshot({
  session,
  collateral,
  conditional,
}: {
  session: TradingUserSession;
  collateral?: BalanceAllowanceResponse;
  conditional?: BalanceAllowanceResponse;
}): UserBalanceSnapshot {
  return {
    walletAddress: session.walletAddress,
    funderAddress: session.funderAddress,
    usdcAvailable: parseAtomicValue(collateral?.balance),
    usdcAllowance: parseAllowanceMap(collateral?.allowances),
    conditionalTokenBalance: parseAtomicValue(conditional?.balance),
    conditionalTokenAllowance: parseAllowanceMap(conditional?.allowances),
    updatedAt: new Date().toISOString(),
  };
}

export function checkOrderFunding({
  balances,
  requirement,
}: {
  balances?: UserBalanceSnapshot;
  requirement?: OrderFundingRequirement;
}): OrderFundingCheck | undefined {
  if (!requirement) {
    return undefined;
  }

  if (!balances || balances.error) {
    const detail = balances?.error ?? "Balance and allowance checks require user CLOB credentials.";

    return {
      balance: "unknown",
      allowance: "unknown",
      balanceDetail: detail,
      allowanceDetail: detail,
    };
  }

  if (requirement.tradeSide === "buy") {
    return checkBuyFunding({ balances, requiredUsdc: requirement.totalCost ?? requirement.cost });
  }

  return checkSellFunding({ balances, requiredShares: requirement.size });
}

export function parseOrderFundingRequirement(value: unknown): OrderFundingRequirement | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const input = value as {
    tradeSide?: unknown;
    cost?: unknown;
    size?: unknown;
    totalCost?: unknown;
    estimatedTakerFee?: unknown;
  };

  if (input.tradeSide !== "buy" && input.tradeSide !== "sell") {
    return undefined;
  }

  const cost = parsePositiveNumber(input.cost);
  const size = parsePositiveNumber(input.size);
  const totalCost = parsePositiveNumber(input.totalCost);
  const estimatedTakerFee = parsePositiveNumber(input.estimatedTakerFee);

  if (cost === undefined || size === undefined) {
    return undefined;
  }

  return {
    tradeSide: input.tradeSide,
    cost,
    size,
    totalCost,
    estimatedTakerFee,
  };
}

export function getOrderFundingRequirementFromSignedOrder(payload: unknown): OrderFundingRequirement | undefined {
  const context = getSignedOrderContext(payload);

  if (!context) {
    return undefined;
  }

  if (context.side === "BUY") {
    return {
      tradeSide: "buy",
      cost: context.makerAmount,
      size: context.takerAmount,
    };
  }

  return {
    tradeSide: "sell",
    cost: context.takerAmount,
    size: context.makerAmount,
  };
}

export function getSignedOrderContext(payload: unknown): SignedOrderContext | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const input = payload as {
    order?: {
      maker?: unknown;
      signer?: unknown;
      taker?: unknown;
      tokenId?: unknown;
      side?: unknown;
      signatureType?: unknown;
      makerAmount?: unknown;
      takerAmount?: unknown;
      builder?: unknown;
      signature?: unknown;
    };
  };
  const maker = parseAddress(input.order?.maker);
  const signer = parseAddress(input.order?.signer);
  const taker = input.order?.taker === undefined ? undefined : parseAddress(input.order.taker);
  const tokenId = parseTokenId(input.order?.tokenId);
  const side = parseSide(input.order?.side);
  const signatureType = parseInteger(input.order?.signatureType);
  const makerAmount = parseAtomicValue(input.order?.makerAmount);
  const takerAmount = parseAtomicValue(input.order?.takerAmount);
  const builder = parseHex(input.order?.builder);
  const signature = parseHex(input.order?.signature);

  if (
    !maker ||
    !signer ||
    (input.order?.taker !== undefined && !taker) ||
    !tokenId ||
    !side ||
    signatureType === undefined ||
    makerAmount === undefined ||
    takerAmount === undefined ||
    !builder ||
    !signature
  ) {
    return undefined;
  }

  return {
    maker,
    signer,
    taker,
    tokenId,
    side,
    signatureType,
    makerAmount,
    takerAmount,
    builder,
    signature,
  };
}

function checkBuyFunding({
  balances,
  requiredUsdc,
}: {
  balances: UserBalanceSnapshot;
  requiredUsdc: number;
}): OrderFundingCheck {
  return {
    balance: compareAvailable(balances.usdcAvailable, requiredUsdc),
    allowance: compareAvailable(balances.usdcAllowance, requiredUsdc),
    balanceDetail: formatFundingDetail({
      label: "USDC balance",
      available: balances.usdcAvailable,
      required: requiredUsdc,
      unit: "USDC",
    }),
    allowanceDetail: formatFundingDetail({
      label: "USDC allowance",
      available: balances.usdcAllowance,
      required: requiredUsdc,
      unit: "USDC",
    }),
  };
}

function estimateFundingBuyTakerFee({
  cost,
  price,
  market,
  builderTakerFeeRate,
}: {
  cost: number;
  price: number;
  market?: MarketDetails;
  builderTakerFeeRate: number;
}): number {
  return estimatePolymarketBuyTakerFee({
    orderCost: cost,
    price,
    fee: market?.fd
      ? {
          rate: market.fd.r ?? 0,
          exponent: market.fd.e ?? 0,
        }
      : undefined,
    builderTakerFeeRate,
  });
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function checkSellFunding({
  balances,
  requiredShares,
}: {
  balances: UserBalanceSnapshot;
  requiredShares: number;
}): OrderFundingCheck {
  return {
    balance: compareAvailable(balances.conditionalTokenBalance, requiredShares),
    allowance: compareAvailable(balances.conditionalTokenAllowance, requiredShares),
    balanceDetail: formatFundingDetail({
      label: "Conditional token balance",
      available: balances.conditionalTokenBalance,
      required: requiredShares,
      unit: "shares",
    }),
    allowanceDetail: formatFundingDetail({
      label: "Conditional token allowance",
      available: balances.conditionalTokenAllowance,
      required: requiredShares,
      unit: "shares",
    }),
  };
}

function compareAvailable(available: number | undefined, required: number): "pass" | "fail" | "unknown" {
  if (available === undefined) {
    return "unknown";
  }

  return available >= required ? "pass" : "fail";
}

function formatFundingDetail({
  label,
  available,
  required,
  unit,
}: {
  label: string;
  available?: number;
  required: number;
  unit: string;
}) {
  if (available === undefined) {
    return `${label} is not available. Required: ${formatAmount(required)} ${unit}.`;
  }

  return `${label}: ${formatAmount(available)} ${unit} available; ${formatAmount(required)} ${unit} required.`;
}

function parsePositiveNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return value;
}

function parseAddress(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(value)) {
    return undefined;
  }

  return value;
}

function parseTokenId(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return undefined;
  }

  return value;
}

function parseSide(value: unknown): SignedOrderContext["side"] | undefined {
  if (value === "BUY" || value === "SELL") {
    return value;
  }

  return undefined;
}

function parseInteger(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return undefined;
  }

  return value;
}

function parseHex(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^0x[a-fA-F0-9]+$/.test(value)) {
    return undefined;
  }

  return value;
}

function parseAtomicValue(value: unknown): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed / 1_000_000;
}

function parseAllowanceMap(allowances: Record<string, string> | undefined): number | undefined {
  if (!allowances) {
    return undefined;
  }

  const values = Object.values(allowances)
    .map(parseAtomicValue)
    .filter((value): value is number => value !== undefined);

  if (values.length === 0) {
    return undefined;
  }

  return Math.max(...values);
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
  }).format(value);
}
