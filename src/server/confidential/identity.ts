import "server-only";

import { authIdentity } from "@defuse-protocol/internal-utils";

const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export function normalizeEvmAddress(address: string): string {
  const value = address.trim();

  if (!EVM_ADDRESS_PATTERN.test(value)) {
    throw new Error("walletAddress must be a valid EVM address.");
  }

  return value;
}

export function deriveIntentsUserId(walletAddress: string): string {
  return authIdentity.authHandleToIntentsUserId(
    normalizeEvmAddress(walletAddress),
    "evm",
  );
}

export function isSameEvmAddress(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}
