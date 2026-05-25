import type { CashBalanceView } from "@/types/funding";
import type { UserBalanceSnapshot, UserTradingReadiness } from "@/types/market";

export function buildCashBalanceView(readiness: UserTradingReadiness | undefined): CashBalanceView | undefined {
  const balances = readiness?.balances;

  if (!balances) {
    return undefined;
  }

  return {
    available: balances.usdcAvailable,
    allowance: balances.usdcAllowance,
    clobAvailable: balances.clobUsdcAvailable,
    clobAllowance: balances.clobUsdcAllowance,
    onchainAvailable: balances.onchainUsdcAvailable,
    onchainAllowance: balances.onchainUsdcAllowance,
    balanceSource: balances.balanceSource,
    updatedAt: balances.updatedAt,
  };
}

export function mapBalanceSnapshotToCash(snapshot: UserBalanceSnapshot): CashBalanceView {
  return {
    available: snapshot.usdcAvailable,
    allowance: snapshot.usdcAllowance,
    clobAvailable: snapshot.clobUsdcAvailable,
    clobAllowance: snapshot.clobUsdcAllowance,
    onchainAvailable: snapshot.onchainUsdcAvailable,
    onchainAllowance: snapshot.onchainUsdcAllowance,
    balanceSource: snapshot.balanceSource,
    updatedAt: snapshot.updatedAt,
  };
}

/** Spendable USDC for trade-ticket cash display and quick-amount "all". */
export function resolveTradeTicketAvailableCash(
  readiness: UserTradingReadiness | undefined
): number | undefined {
  const balances = readiness?.balances;

  if (!balances) {
    return undefined;
  }

  return balances.clobUsdcAvailable ?? balances.usdcAvailable;
}
