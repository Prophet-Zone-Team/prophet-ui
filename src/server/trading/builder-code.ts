import "server-only";

import type { Hex } from "viem";

import {
  BUILDER_MAKER_FEE_RATE,
  BUILDER_TAKER_FEE_RATE
} from "@/lib/market/polymarket-fees";

export { BUILDER_MAKER_FEE_RATE, BUILDER_TAKER_FEE_RATE };

export const ZERO_ORDER_BUILDER_CODE =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

export function getPolymarketBuilderCode(): Hex | undefined {
  const value = process.env.POLYMARKET_BUILDER_CODE?.trim() ?? process.env.BUILDER_CODE?.trim();

  return value && /^0x[a-fA-F0-9]{64}$/.test(value) ? (value as Hex) : undefined;
}

export function getOrderBuilderCode(): Hex {
  return getPolymarketBuilderCode() ?? ZERO_ORDER_BUILDER_CODE;
}

export function getBuilderMakerFeeRate(): number {
  return BUILDER_MAKER_FEE_RATE;
}

export function getBuilderTakerFeeRate(): number {
  return BUILDER_TAKER_FEE_RATE;
}
