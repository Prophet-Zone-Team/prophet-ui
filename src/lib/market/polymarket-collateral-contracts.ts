import { POLYMARKET_USD } from "@/config/funding";

/**
 * Polygon mainnet collateral contracts for deposit-wallet withdrawals.
 * See https://docs.polymarket.com/resources/contracts
 */
export const POLYGON_COLLATERAL_CONTRACTS = {
  pUsd: POLYMARKET_USD.address,
  /** Permissionless Collateral Offramp — unwrap pUSD to USDC.e */
  offramp: "0x2957922Eb93258b93368531d39fAcCA3B4dC5854",
} as const;

export const POLYGON_CHAIN_ID = 137;
