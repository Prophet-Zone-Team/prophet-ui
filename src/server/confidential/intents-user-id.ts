import "server-only";

import { authIdentity, type AuthMethod } from "@defuse-protocol/internal-utils";

export const CONFIDENTIAL_AUTH_METHOD: AuthMethod = "evm";

const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export function normalizeEvmAddress(address: string): string {
  const value = address.trim();

  if (!EVM_ADDRESS_PATTERN.test(value)) {
    throw new Error("Invalid EVM wallet address.");
  }

  return value.toLowerCase();
}

/**
 * Derive the canonical NEAR Intents user id for an EVM EOA. The Confidential
 * account is addressed by this id; for EVM wallets it is the lowercased address.
 */
export function deriveIntentsUserId(eoaAddress: string) {
  return authIdentity.authHandleToIntentsUserId(
    normalizeEvmAddress(eoaAddress),
    CONFIDENTIAL_AUTH_METHOD,
  );
}

export function isMatchingIntentsUserId(
  eoaAddress: string,
  intentsUserId: string,
): boolean {
  try {
    return deriveIntentsUserId(eoaAddress).toLowerCase() === intentsUserId.toLowerCase();
  } catch {
    return false;
  }
}
