import type { BidTradeSide, MockBidOrderType, MockBidSide, TeamMarketSnapshot } from "../../types/market";
import { calculateMockOrderSimulation, normalizeLimitPrice } from "./mockBid";

type PolymarketTickSize = NonNullable<TeamMarketSnapshot["market"]["polymarket"]>["tickSize"];

export interface BidOrderPreviewInput {
  snapshot: TeamMarketSnapshot;
  outcomeSide: MockBidSide;
  tradeSide: BidTradeSide;
  amount: number;
  limitPrice: number;
  orderType: MockBidOrderType;
  createdAt?: string;
  includeOrderId?: boolean;
}

export interface BidOrderPreview {
  outcomeSide: MockBidSide;
  tradeSide: BidTradeSide;
  tokenId?: string;
  tickSize?: PolymarketTickSize;
  negRisk?: boolean;
  acceptingOrders: boolean;
  minOrderSize?: number;
  sidePrice: number;
  shareSize: number;
  estimatedCost: number;
  potentialPayout: number;
  potentialOutcome: number;
  simulatedTokenId: string;
  simulatedOrderId?: string;
  expiresAt?: string;
  canSubmitRealOrder: boolean;
  disabledReason?: string;
}

export function buildBidOrderPreview(input: BidOrderPreviewInput): BidOrderPreview {
  const token = input.snapshot.market.polymarket?.tokens[input.outcomeSide];
  const metadata = input.snapshot.market.polymarket;
  const sidePrice = normalizeLimitPrice(input.limitPrice);
  const simulation = calculateMockOrderSimulation({
    teamId: input.snapshot.team.id,
    teamCode: input.snapshot.team.code,
    side: input.outcomeSide,
    tradeSide: input.tradeSide,
    stake: input.amount,
    probability: input.snapshot.market.probability,
    limitPrice: sidePrice,
    orderType: input.orderType,
    createdAt: input.createdAt,
    includeOrderId: input.includeOrderId,
  });
  const disabledReason = getDisabledReason({
    acceptingOrders: metadata?.acceptingOrders,
    amount: input.amount,
    minOrderSize: metadata?.minOrderSize,
    orderType: input.orderType,
    tokenId: token?.tokenId,
  });

  return {
    outcomeSide: input.outcomeSide,
    tradeSide: input.tradeSide,
    tokenId: token?.tokenId,
    tickSize: metadata?.tickSize,
    negRisk: metadata?.negRisk,
    acceptingOrders: metadata?.acceptingOrders === true,
    minOrderSize: metadata?.minOrderSize,
    sidePrice,
    shareSize: simulation.shareSize,
    estimatedCost: simulation.estimatedCost,
    potentialPayout: simulation.potentialPayout,
    potentialOutcome: simulation.potentialOutcome,
    simulatedTokenId: token?.tokenId ?? simulation.simulatedTokenId,
    simulatedOrderId: simulation.simulatedOrderId,
    expiresAt: simulation.expiresAt,
    canSubmitRealOrder: !disabledReason,
    disabledReason,
  };
}

function getDisabledReason({
  acceptingOrders,
  amount,
  minOrderSize,
  orderType,
  tokenId,
}: {
  acceptingOrders?: boolean;
  amount: number;
  minOrderSize?: number;
  orderType: MockBidOrderType;
  tokenId?: string;
}): string | undefined {
  if (!tokenId) {
    return "No Polymarket token ID is available for this outcome.";
  }

  if (acceptingOrders !== true) {
    return "This Polymarket market is not accepting orders.";
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return "Enter a positive amount.";
  }

  if (minOrderSize !== undefined && amount < minOrderSize) {
    return `Amount must be at least ${minOrderSize}.`;
  }

  if (orderType === "GTD") {
    return "GTD requires an explicit exchange expiration flow; use GTC, FOK, or FAK for now.";
  }

  return undefined;
}
