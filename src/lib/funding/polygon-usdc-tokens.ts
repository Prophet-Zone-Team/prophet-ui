import { getAddress } from "viem";

import { POLYGON_USDC_NATIVE } from "@/lib/funding/stableflow";
import { POLYGON_USDC_BRIDGED } from "@/lib/market/deposit-wallet-batch";

export type PolygonUsdcToken = {
  symbol: "USDC" | "USDC.e";
  address: string;
};

export const POLYGON_ACCEPTED_USDC_TOKENS: PolygonUsdcToken[] = [
  { symbol: "USDC", address: getAddress(POLYGON_USDC_NATIVE) },
  { symbol: "USDC.e", address: getAddress(POLYGON_USDC_BRIDGED) },
];
