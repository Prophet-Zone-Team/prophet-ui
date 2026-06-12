"use client";

import { useMemo } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount } from "wagmi";

import { isPrivyEmbeddedWallet } from "@/context/privy/privy-wallet-bridge";
import { parseCaip2ChainId } from "@/lib/wallet/evm/signer-source";
import type { UnifiedWalletAccount } from "@/lib/wallet/types";
import { useAuthStore } from "@/store/auth-store";

/**
 * Reactive account snapshot merging the wagmi connection (external wallets)
 * with the Privy embedded wallet (email/google logins), which is not
 * registered as a wagmi connector.
 */
export function useUnifiedAccount(): UnifiedWalletAccount {
  const wagmiAccount = useAccount();
  const { wallets } = useWallets();
  const { ready, authenticated } = usePrivy();
  const loginMethod = useAuthStore((state) => state.loginMethod);

  return useMemo(() => {
    const preferEmbedded = loginMethod === "email" || loginMethod === "google";
    const embedded =
      ready && authenticated ? wallets.find(isPrivyEmbeddedWallet) : undefined;

    if (preferEmbedded && embedded) {
      return {
        address: embedded.address,
        chainId: parseCaip2ChainId(embedded.chainId),
        connected: true,
        source: "privy" as const,
      };
    }

    if (wagmiAccount.isConnected && wagmiAccount.address) {
      return {
        address: wagmiAccount.address,
        chainId: wagmiAccount.chainId,
        connected: true,
        source: "wagmi" as const,
      };
    }

    if (embedded) {
      return {
        address: embedded.address,
        chainId: parseCaip2ChainId(embedded.chainId),
        connected: true,
        source: "privy" as const,
      };
    }

    return { connected: false };
  }, [
    authenticated,
    loginMethod,
    ready,
    wagmiAccount.address,
    wagmiAccount.chainId,
    wagmiAccount.isConnected,
    wallets,
  ]);
}
