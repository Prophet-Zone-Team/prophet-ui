import type { ComboTicketLeg } from "@/types/combo";

export interface ComboPreviewEstimate {
  impliedProbability: number;
  multiplier: number;
  toWinAmount: number;
}

export function estimateComboPreview(input: {
  legs: ComboTicketLeg[];
  bidAmountUsd: number;
}): ComboPreviewEstimate {
  const { legs, bidAmountUsd } = input;

  if (legs.length === 0 || bidAmountUsd <= 0) {
    return {
      impliedProbability: 0,
      multiplier: 0,
      toWinAmount: 0,
    };
  }

  const impliedProbability = legs.reduce((product, leg) => {
    if (leg.referencePrice <= 0) {
      return 0;
    }

    return product * leg.referencePrice;
  }, 1);

  if (impliedProbability <= 0) {
    return {
      impliedProbability: 0,
      multiplier: 0,
      toWinAmount: 0,
    };
  }

  const multiplier = 1 / impliedProbability;

  return {
    impliedProbability,
    multiplier,
    toWinAmount: bidAmountUsd * multiplier,
  };
}

export function estimateMultiplierFromBlendedPrice(blendedPrice: number): number {
  if (!Number.isFinite(blendedPrice) || blendedPrice <= 0) {
    return 0;
  }

  return 1 / blendedPrice;
}

export function parseE6Value(value: string | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed / 1_000_000;
}

export function toE6String(value: number): string {
  return Math.round(value * 1_000_000).toString();
}

export function isQuoteExpired(expiresAt: number, now = Date.now()): boolean {
  return expiresAt > 0 && now >= expiresAt;
}
