"use client";

import { signMessageWithWallet } from "@/components/trading/wallet-provider";

/**
 * Sign an ERC191 message string with the connected EOA. Used both for the
 * Confidential authentication challenge and for signing unshield intents.
 */
export async function signConfidentialMessage(
  eoaAddress: string,
  message: string,
): Promise<string> {
  return signMessageWithWallet(eoaAddress, message);
}
