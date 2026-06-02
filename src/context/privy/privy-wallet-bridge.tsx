"use client";

import { useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { getAccount } from "wagmi/actions";
import type { ConnectedWallet } from "@privy-io/react-auth";

import { wagmiConfig } from "@/context/rainbowkit/wagmi-config";

let setActiveWalletRef:
  | ((wallet: ConnectedWallet) => Promise<void>)
  | undefined;
let connectedWalletsRef: ConnectedWallet[] = [];

function addressesMatch(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}

export function findPrivyWallet(expectedAddress?: string): ConnectedWallet | undefined {
  if (expectedAddress) {
    const matched = connectedWalletsRef.find((wallet) =>
      addressesMatch(wallet.address, expectedAddress),
    );

    if (matched) {
      return matched;
    }
  }

  return connectedWalletsRef[0];
}

export async function activatePrivyWallet(
  expectedAddress?: string,
): Promise<string | undefined> {
  const wallet = findPrivyWallet(expectedAddress);

  if (!wallet || !setActiveWalletRef) {
    return undefined;
  }

  await setActiveWalletRef(wallet);

  return wallet.address;
}

/**
 * Syncs the Privy wallet list into wagmi's active wallet so the existing
 * wagmi-based trading flow keeps working for embedded and external wallets.
 */
export function PrivyWalletBridge() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  useEffect(() => {
    setActiveWalletRef = setActiveWallet;
    connectedWalletsRef = wallets;

    return () => {
      if (setActiveWalletRef === setActiveWallet) {
        setActiveWalletRef = undefined;
      }
    };
  }, [setActiveWallet, wallets]);

  useEffect(() => {
    if (!ready || !authenticated || wallets.length === 0) {
      return;
    }

    const account = getAccount(wagmiConfig);

    if (account.isConnected && account.address) {
      return;
    }

    void setActiveWallet(wallets[0]);
  }, [authenticated, ready, setActiveWallet, wallets]);

  return null;
}
