import "server-only";

import type { Hex } from "viem";

import { getTradingHost } from "@/server/trading/clob-auth";
import { serverFetch } from "@/server/trading/server-fetch";

const ZERO_BUILDER_CODE = "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

export function getPolymarketBuilderCode(): Hex | undefined {
  const value = process.env.POLYMARKET_BUILDER_CODE?.trim() ?? process.env.BUILDER_CODE?.trim();

  return value && /^0x[a-fA-F0-9]{64}$/.test(value) ? (value as Hex) : undefined;
}

export function getOrderBuilderCode(): Hex {
  return getPolymarketBuilderCode() ?? ZERO_BUILDER_CODE;
}

export async function getBuilderTakerFeeRate(builderCode = getOrderBuilderCode()): Promise<number> {
  if (!builderCode || builderCode === ZERO_BUILDER_CODE) {
    return 0;
  }

  const response = await serverFetch(`${getTradingHost()}/fees/builder-fees/${builderCode}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return 0;
  }

  const payload = (await response.json()) as { builder_taker_fee_rate_bps?: unknown };
  const parsed = typeof payload.builder_taker_fee_rate_bps === "number" ? payload.builder_taker_fee_rate_bps : undefined;

  return parsed && Number.isFinite(parsed) ? parsed / 10000 : 0;
}
