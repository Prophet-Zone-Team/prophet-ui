import { POLYMARKET_USD } from "@/config/funding";

/**
 * Polygon mainnet collateral and bridge contracts for deposit-wallet withdrawals.
 * See https://docs.polymarket.com/resources/contracts
 */
export const POLYGON_COLLATERAL_CONTRACTS = {
  pUsd: POLYMARKET_USD.address,
  usdcE: POLYMARKET_USD.underlyingToken.address,
  collateralOfframp: "0x2957922Eb93258b93368531d39fAcCA3B4dC5854",
  bridgeRouter: "0x4cd00e387622c35bddb9b4c962c136462338bc31",
} as const;

export const POLYGON_CHAIN_ID = 137;

export const QUOTE_ID_PATTERN = /^0x[a-fA-F0-9]{64}$/;
