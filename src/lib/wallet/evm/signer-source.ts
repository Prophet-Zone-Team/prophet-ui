"use client";

import type { ConnectedWallet } from "@privy-io/react-auth";
import { getAccount } from "wagmi/actions";
import type { Connector } from "wagmi";

import { wagmiConfig } from "@/context/rainbowkit/wagmi-config";
import {
  findPrivyEmbeddedWallet,
  findPrivyWallet,
} from "@/context/privy/privy-wallet-bridge";
import { useAuthStore } from "@/store/auth-store";
import type { UnifiedWalletAccount } from "@/lib/wallet/types";

/**
 * Where the active EVM signer lives. External wallets stay connected through
 * wagmi/RainbowKit; email/google logins use a Privy embedded wallet that is
 * not registered as a wagmi connector.
 */
export type EvmSignerSource =
  | { kind: "wagmi"; address: string; chainId?: number; connector: Connector }
  | { kind: "privy"; wallet: ConnectedWallet };

export function isEmbeddedLoginMethod(): boolean {
  const loginMethod = useAuthStore.getState().loginMethod;
  return loginMethod === "email" || loginMethod === "google";
}

export function parseCaip2ChainId(chainId: string | undefined): number | undefined {
  if (!chainId) {
    return undefined;
  }

  const raw = chainId.includes(":") ? chainId.split(":")[1] : chainId;
  const parsed = Number.parseInt(raw, raw.startsWith("0x") ? 16 : 10);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function isSameAddress(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}

function resolveLiveConnector(connector: Connector | undefined): Connector | undefined {
  if (!connector) {
    return undefined;
  }

  if (typeof connector.getProvider === "function") {
    return connector;
  }

  return wagmiConfig.connectors.find(
    (candidate) => candidate.uid === connector.uid || candidate.id === connector.id,
  );
}

export function resolveEvmSignerSource(walletAddress?: string): EvmSignerSource {
  const preferEmbedded = isEmbeddedLoginMethod();

  if (preferEmbedded) {
    const embedded = findPrivyEmbeddedWallet(walletAddress);

    if (embedded && (!walletAddress || isSameAddress(embedded.address, walletAddress))) {
      return { kind: "privy", wallet: embedded };
    }
  }

  const account = getAccount(wagmiConfig);
  const wagmiMatches =
    account.isConnected &&
    Boolean(account.address) &&
    (!walletAddress || isSameAddress(account.address as string, walletAddress));

  if (wagmiMatches) {
    const connector = resolveLiveConnector(account.connector);

    if (connector) {
      return {
        kind: "wagmi",
        address: account.address as string,
        chainId: account.chainId,
        connector,
      };
    }
  }

  const privyWallet = findPrivyWallet(walletAddress, { preferEmbedded });

  if (
    privyWallet &&
    (!walletAddress || isSameAddress(privyWallet.address, walletAddress))
  ) {
    return { kind: "privy", wallet: privyWallet };
  }

  if (wagmiMatches) {
    throw new Error(
      "Unable to access the connected wallet connector. Reconnect and try again.",
    );
  }

  if (account.isConnected && account.address && walletAddress) {
    throw new Error(
      `The connected trading session is ${walletAddress}, but the active wallet is ${account.address}. Switch your wallet account or reconnect.`,
    );
  }

  throw new Error("No wallet connected. Connect your wallet to continue.");
}

/** Non-throwing snapshot of the active EVM account across wagmi and Privy. */
export function getActiveEvmAccount(): UnifiedWalletAccount {
  if (isEmbeddedLoginMethod()) {
    const embedded = findPrivyEmbeddedWallet();

    if (embedded) {
      return {
        address: embedded.address,
        chainId: parseCaip2ChainId(embedded.chainId),
        connected: true,
        source: "privy",
      };
    }
  }

  const account = getAccount(wagmiConfig);

  if (account.isConnected && account.address) {
    return {
      address: account.address,
      chainId: account.chainId,
      connected: true,
      source: "wagmi",
    };
  }

  const embedded = findPrivyEmbeddedWallet();

  if (embedded) {
    return {
      address: embedded.address,
      chainId: parseCaip2ChainId(embedded.chainId),
      connected: true,
      source: "privy",
    };
  }

  return { connected: false };
}
