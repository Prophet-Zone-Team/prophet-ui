import type { TradingUserSession } from "@/types/market";

import type { PrivateAccountStatus } from "./types";

export function resolvePrivateAccountStatus(
  session: Pick<TradingUserSession, "privateAccountAddress"> | null | undefined,
  privateBalanceUsd?: number,
): PrivateAccountStatus {
  if (!session?.privateAccountAddress) {
    return "not_created";
  }

  if (privateBalanceUsd !== undefined && privateBalanceUsd > 0) {
    return "funded";
  }

  return "created_empty";
}
