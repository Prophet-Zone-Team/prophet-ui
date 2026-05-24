import { POLYMARKET_USD } from "@/config/funding";

/**
 * Polygon mainnet collateral contracts for deposit-wallet withdrawals.
 * See https://docs.polymarket.com/resources/contracts
 */
export const POLYGON_COLLATERAL_CONTRACTS = {
  pUsd: POLYMARKET_USD.address,
} as const;

export const POLYGON_CHAIN_ID = 137;
