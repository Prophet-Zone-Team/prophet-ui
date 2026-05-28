import type { TradingSetupAllowances, TradingUserSession } from "@/types/market";

export const SETUP_ALLOWANCE_FRESH_MS = 1000 * 60 * 10;

export function isSetupAllowanceCacheFresh(session: TradingUserSession): boolean {
  if (!session.setupAllowancesCheckedAt || !session.setupAllowances) {
    return false;
  }

  const checkedAt = Date.parse(session.setupAllowancesCheckedAt);

  if (!Number.isFinite(checkedAt)) {
    return false;
  }

  return Date.now() - checkedAt < SETUP_ALLOWANCE_FRESH_MS;
}

export function invalidateSetupAllowanceCache(session: TradingUserSession): TradingUserSession {
  return {
    ...session,
    setupAllowances: undefined,
    setupAllowancesCheckedAt: undefined,
  };
}

export function withSetupAllowanceCache(
  session: TradingUserSession,
  allowances: TradingSetupAllowances,
  checkedAt: string,
): TradingUserSession {
  return {
    ...session,
    setupAllowances: allowances,
    setupAllowancesCheckedAt: checkedAt,
  };
}
