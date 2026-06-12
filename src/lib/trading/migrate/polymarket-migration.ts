import {
  deriveDepositWallet,
  deriveProxyWallet,
  deriveSafe,
  RelayerTxType,
} from "@polymarket/builder-relayer-client";

import { POLYMARKET_USD } from "@/config/funding";

export type LegacyPolymarketAccountType = "proxy" | "safe";

export const USDC_DECIMALS = 6;
export const MIN_MIGRATION_ATOMIC = process.env.NEXT_PUBLIC_MIGRATE_MIN_WEI ? BigInt(process.env.NEXT_PUBLIC_MIGRATE_MIN_WEI) : 100000n;
export const MIN_MIGRATION_USD = Number(MIN_MIGRATION_ATOMIC) / (10 ** USDC_DECIMALS);

export const POLYMARKET_POLYGON_CHAIN_ID = 137;
export const POLYMARKET_COLLATERAL_TOKEN = POLYMARKET_USD.address;
export const POLYMARKET_LEGACY_PROXY_FACTORY = "0xaB45c5A4B0c941a2F231C04C3f49182e1A254052";
export const POLYMARKET_LEGACY_RELAY_HUB = "0xD216153c06E857cD7f72665E0aF1d7D82172F494";
export const POLYMARKET_LEGACY_SAFE_FACTORY = "0xaacFeEa03eb1561C4e67d661e40682Bd20E3541b";
export const POLYMARKET_DEPOSIT_WALLET_FACTORY = "0x00000000000Fb5C9ADea0298D729A0CB3823Cc07";
export const POLYMARKET_DEPOSIT_WALLET_IMPLEMENTATION = "0x58CA52ebe0DadfdF531Cde7062e76746de4Db1eB";

export const LEGACY_ACCOUNT_OPTIONS: Array<{
  type: LegacyPolymarketAccountType;
  signatureType: 1 | 2;
  relayerType: RelayerTxType;
  labelKey: "v1Account" | "v2Account";
}> = [
    {
      type: "proxy",
      signatureType: 1,
      relayerType: RelayerTxType.PROXY,
      labelKey: "v1Account",
    },
    {
      type: "safe",
      signatureType: 2,
      relayerType: RelayerTxType.SAFE,
      labelKey: "v2Account",
    },
  ];

export function deriveLegacyPolymarketAccount(
  ownerAddress: string,
  type: LegacyPolymarketAccountType,
) {
  if (type === "proxy") {
    return deriveProxyWallet(ownerAddress, POLYMARKET_LEGACY_PROXY_FACTORY);
  }

  return deriveSafe(ownerAddress, POLYMARKET_LEGACY_SAFE_FACTORY);
}

export function derivePolymarketDepositWallet(ownerAddress: string) {
  return deriveDepositWallet(
    ownerAddress,
    POLYMARKET_DEPOSIT_WALLET_FACTORY,
    POLYMARKET_DEPOSIT_WALLET_IMPLEMENTATION,
  );
}

export function getLegacyAccountLabelKey(type: LegacyPolymarketAccountType) {
  return LEGACY_ACCOUNT_OPTIONS.find((option) => option.type === type)?.labelKey ?? "v1Account";
}

export function atomicUsdcToUsd(value: bigint) {
  return Number(value) / 10 ** USDC_DECIMALS;
}

export function usdToAtomicUsdc(value: number) {
  return BigInt(Math.floor(value * 10 ** USDC_DECIMALS));
}
