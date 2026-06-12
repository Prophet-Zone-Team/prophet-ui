import type { LegacyPolymarketAccountType } from "@/lib/trading/migrate/polymarket-migration";

export interface LegacyMigrationAccount {
  type: LegacyPolymarketAccountType;
  address: string;
  balanceAtomic: bigint;
  balanceUsd: number;
}

export interface LegacyBalanceSnapshot {
  accounts: LegacyMigrationAccount[];
  bestAccount?: LegacyMigrationAccount;
  hasMigratableBalance: boolean;
  scannedAt: string;
}

export interface MigrationExecutionResult {
  transactionID?: string;
  state?: string;
  hash?: string;
  transactionHash?: string;
}
