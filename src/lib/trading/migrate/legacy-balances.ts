import { erc20Abi, type Address } from "viem";

import { getFundingPublicClient } from "@/lib/funding/funding-chain-client";
import { POLYGON_CHAIN_ID } from "@/lib/market/polymarket-collateral-contracts";
import {
  deriveLegacyPolymarketAccount,
  LEGACY_ACCOUNT_OPTIONS,
  MIN_MIGRATION_USD,
  POLYMARKET_COLLATERAL_TOKEN,
  atomicUsdcToUsd,
} from "@/lib/trading/migrate/polymarket-migration";
import type {
  LegacyBalanceSnapshot,
  LegacyMigrationAccount,
} from "@/lib/trading/migrate/types";

export async function scanLegacyBalances(ownerAddress: string): Promise<LegacyBalanceSnapshot> {
  const client = getFundingPublicClient(POLYGON_CHAIN_ID);
  const collateral = POLYMARKET_COLLATERAL_TOKEN as Address;

  const accounts = await Promise.all(
    LEGACY_ACCOUNT_OPTIONS.map(async (option) => {
      const address = deriveLegacyPolymarketAccount(ownerAddress, option.type);
      const balanceAtomic = await client.readContract({
        address: collateral,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as Address],
      });

      return {
        type: option.type,
        address,
        balanceAtomic,
        balanceUsd: atomicUsdcToUsd(balanceAtomic),
      } satisfies LegacyMigrationAccount;
    }),
  );

  const bestAccount = selectBestMigratableAccount(accounts);

  return {
    accounts,
    bestAccount,
    hasMigratableBalance: Boolean(bestAccount),
    scannedAt: new Date().toISOString(),
  };
}

function selectBestMigratableAccount(accounts: LegacyMigrationAccount[]) {
  const eligible = accounts.filter((account) => account.balanceUsd >= MIN_MIGRATION_USD);

  if (eligible.length === 0) {
    return undefined;
  }

  return eligible.reduce((best, current) =>
    current.balanceAtomic > best.balanceAtomic ? current : best,
  );
}
