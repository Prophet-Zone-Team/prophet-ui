"use client";

import { useCallback, useState } from "react";
import { useAccount } from "wagmi";

import { disconnectWagmiWallet } from "@/components/trading/wallet-provider";
import { useConnectGate } from "@/context/rainbowkit/connect-gate";

export interface UseFundingWalletResult {
  address?: string;
  connected: boolean;
  connecting: boolean;
  error?: string;
  connect: () => Promise<string | undefined>;
  disconnect: () => Promise<void>;
}

/**
 * Funding Wallet connection for the private domain. This is intentionally
 * independent from the main-site trading auth flow: it only opens the wallet
 * connect modal and tracks the connected address so the user can fund their
 * Confidential account. It never triggers a Polymarket trading login.
 */
export function useFundingWallet(): UseFundingWalletResult {
  const { openConnectAndWait } = useConnectGate();
  const { address, isConnected } = useAccount();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(undefined);

    try {
      return await openConnectAndWait();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to connect wallet.");
      return undefined;
    } finally {
      setConnecting(false);
    }
  }, [openConnectAndWait]);

  const disconnect = useCallback(async () => {
    try {
      await disconnectWagmiWallet();
    } catch {
      // Ignore disconnect errors; the wallet may already be disconnected.
    }
  }, []);

  return {
    address: isConnected ? address : undefined,
    connected: isConnected && Boolean(address),
    connecting,
    error,
    connect,
    disconnect,
  };
}
