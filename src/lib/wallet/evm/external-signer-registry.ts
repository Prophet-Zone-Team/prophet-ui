import type { WalletClient } from "viem";

export interface ExternalTypedDataPayload {
  domain: object;
  types: object;
  primaryType: string;
  message: object;
}

/**
 * A non-wagmi, non-Privy EVM signer that produces signatures through some
 * external mechanism (e.g. a NEAR MPC-derived key, or a future TON bridge).
 * Each integration registers one instance for the address it controls; the
 * shared EVM adapter delegates to it without knowing the underlying chain.
 */
export interface ExternalEvmSigner {
  address: string;
  signMessage(message: string): Promise<`0x${string}`>;
  signTypedData(payload: ExternalTypedDataPayload): Promise<string>;
  getWalletClient(chainId?: number): Promise<WalletClient>;
}

const registry = new Map<string, ExternalEvmSigner>();

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

export function registerExternalEvmSigner(signer: ExternalEvmSigner): void {
  registry.set(normalizeAddress(signer.address), signer);
}

export function unregisterExternalEvmSigner(address: string): void {
  registry.delete(normalizeAddress(address));
}

/**
 * Returns the registered signer matching the address, or the only registered
 * signer when no address is supplied. Returns undefined when nothing matches.
 */
export function getExternalEvmSigner(
  address?: string,
): ExternalEvmSigner | undefined {
  if (address) {
    return registry.get(normalizeAddress(address));
  }

  if (registry.size === 1) {
    return registry.values().next().value;
  }

  return undefined;
}

export function hasExternalEvmSigner(address?: string): boolean {
  return Boolean(getExternalEvmSigner(address));
}
