import { POLYMARKET_USD } from "@/config/funding";

/**
 * Polygon mainnet collateral contracts for deposit-wallet withdrawals.
 * See https://docs.polymarket.com/resources/contracts
 */
export const POLYGON_COLLATERAL_CONTRACTS = {
  pUsd: POLYMARKET_USD.address,
  /** Permissionless Collateral Offramp — unwrap pUSD to USDC.e */
  offramp: "0x2957922Eb93258b93368531d39fAcCA3B4dC5854",
  /** pUSD-native CTF redeem for standard markets */
  ctfCollateralAdapter: "0xAdA100Db00Ca00073811820692005400218FcE1f",
  /** pUSD-native CTF redeem for neg-risk markets */
  negRiskCtfCollateralAdapter: "0xadA2005600Dec949baf300f4C6120000bDB6eAab",
} as const;

export const POLYGON_CHAIN_ID = 137;
