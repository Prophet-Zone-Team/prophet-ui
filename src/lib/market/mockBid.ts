import type { BidTradeSide, MockBidOrderType, MockBidSide, Team } from "../../types/market";

const MIN_PRICE = 0.01;
const MAX_PRICE = 0.99;

export interface MockOrderSimulationInput {
  teamId: Team["id"];
  teamCode: string;
  side: MockBidSide;
  tradeSide?: BidTradeSide;
  stake: number;
  probability: number;
  limitPrice?: number;
  orderType: MockBidOrderType;
  createdAt?: string;
  includeOrderId?: boolean;
}

export interface MockOrderSimulation {
  sidePrice: number;
  shareSize: number;
  estimatedCost: number;
  potentialPayout: number;
  potentialOutcome: number;
  simulatedTokenId: string;
  simulatedOrderId?: string;
  expiresAt?: string;
}

export function calculatePotentialPayout(stake: number, probability: number): number {
  if (stake <= 0 || probability <= 0) {
    return 0;
  }

  return roundMoney(stake / (probability / 100));
}

export function calculateReferencePrice(probability: number, side: MockBidSide): number {
  const normalizedProbability = clamp(probability / 100, MIN_PRICE, MAX_PRICE);

  return side === "yes" ? roundPrice(normalizedProbability) : roundPrice(1 - normalizedProbability);
}

export function calculateOutcomeReferencePrice(probability: number, side: MockBidSide): number {
  return calculateReferencePrice(probability, side);
}

export function normalizeLimitPrice(price: number): number {
  if (!Number.isFinite(price)) {
    return MIN_PRICE;
  }

  return roundPrice(clamp(price, MIN_PRICE, MAX_PRICE));
}

export function calculateMockOrderSimulation(input: MockOrderSimulationInput): MockOrderSimulation {
  const createdAt = input.createdAt;
  const sidePrice = normalizeLimitPrice(input.limitPrice ?? calculateReferencePrice(input.probability, input.side));
  const estimatedCost = roundMoney(Math.max(0, input.stake));
  const tradeSide = input.tradeSide ?? "buy";
  const shareSize = tradeSide === "buy" && sidePrice > 0 ? roundShares(estimatedCost / sidePrice) : roundShares(estimatedCost);
  const potentialPayout = tradeSide === "buy" ? roundMoney(shareSize) : roundMoney(shareSize * sidePrice);
  const shouldCreateOrderId = input.includeOrderId === true && createdAt;

  return {
    sidePrice,
    shareSize,
    estimatedCost,
    potentialPayout,
    potentialOutcome: roundMoney(potentialPayout - estimatedCost),
    simulatedTokenId: createSimulatedTokenId(input.teamId, input.side),
    simulatedOrderId: shouldCreateOrderId
      ? createSimulatedOrderId(input.teamId, input.teamCode, input.side, input.orderType, createdAt)
      : undefined,
    expiresAt: input.orderType === "GTD" && createdAt ? createGtdExpiry(createdAt) : undefined,
  };
}

export function formatPriceCents(price: number): string {
  return `${(normalizeLimitPrice(price) * 100).toFixed(1)}c`;
}

export function formatShareSize(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
  }).format(value);
}

function createGtdExpiry(createdAt: string): string {
  const date = new Date(createdAt);
  date.setDate(date.getDate() + 7);

  return date.toISOString();
}

function createSimulatedTokenId(teamId: Team["id"], side: MockBidSide): string {
  return `sim-${side}-${hashParts([teamId, side]).slice(0, 16)}`;
}

function createSimulatedOrderId(
  teamId: Team["id"],
  teamCode: string,
  side: MockBidSide,
  orderType: MockBidOrderType,
  createdAt: string,
): string {
  return `mock-${hashParts([teamId, teamCode, side, orderType, createdAt]).slice(0, 18)}`;
}

function hashParts(parts: string[]): string {
  const input = parts.join(":");
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundPrice(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundShares(value: number): number {
  return Math.round(value * 10000) / 10000;
}
