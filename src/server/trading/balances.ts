import "server-only";

import type { ApiKeyCreds, BalanceAllowanceResponse, MarketDetails } from "@polymarket/clob-client-v2";

import { estimateBuyTakerFee as estimatePolymarketBuyTakerFee } from "@/lib/market/polymarket-fees";
import { mergeCollateralSnapshots } from "@/lib/trading/collateral-balance-merge";
import { fetchOnchainCollateralSnapshot } from "@/lib/trading/onchain-collateral";
import {
  checkOrderFunding,
  parseOrderFundingRequirement,
  type OrderFundingCheck,
  type OrderFundingRequirement,
} from "@/lib/trading/order-funding-check";
import type { TradingUserSession, UserBalanceSnapshot } from "@/types/market";
import { getBuilderTakerFeeRate } from "@/server/trading/builder-code";
import { fetchClobMarketDetails, fetchUserBalanceAllowance } from "@/server/trading/clob-user-client";

export type { OrderFundingCheck, OrderFundingRequirement };
export { checkOrderFunding, parseOrderFundingRequirement };

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
  includeOnchain = false,
}: {
  session: TradingUserSession;
  credentials: ApiKeyCreds;
  tokenId?: string;
  includeOnchain?: boolean;
}): Promise<UserBalanceSnapshot> {
  try {
    const result = await fetchUserBalanceAllowance({
      address: session.walletAddress,
      credentials,
      signatureType: session.signatureType,
      tokenId,
    });

    const clobSnapshot = toBalanceSnapshot({
      session,
      collateral: result.collateral,
      conditional: result.conditional,
    });

    if (!includeOnchain || session.signatureType !== 3 || !session.funderAddress) {
      return clobSnapshot;
    }

    const onchainSnapshot = await fetchOnchainCollateralSnapshot(session.funderAddress);

    if (onchainSnapshot.error) {
      return clobSnapshot;
    }

    return mergeCollateralSnapshots(clobSnapshot, onchainSnapshot);
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
  const taker = input.order?.taker === undefined ? undefined : parseAddress(input.order?.taker);
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
