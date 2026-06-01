import type { PrivateAccountStatus } from "./types";

/**
 * Determine the Private (Confidential) account status from whether a verified
 * Confidential session exists and the private USDC balance.
 */
export function resolvePrivateAccountStatus(
  hasPrivateAccount: boolean,
  privateBalanceUsd?: number,
): PrivateAccountStatus {
  if (!hasPrivateAccount) {
    return "not_created";
  }

  if (privateBalanceUsd !== undefined && privateBalanceUsd > 0) {
    return "funded";
  }

  return "created_empty";
}
