"use client";

import type { TradingUserSession } from "@/types/market";
import type { WalletProviderKind } from "@/components/trading/wallet-provider";
import { connectorIdToProviderKind } from "@/components/trading/wallet-provider";

const PROVIDER_STORAGE_PREFIX = "wc_trading_wallet_provider";

export async function loadTradingSession() {
  const response = await fetch("/api/trading/session", {
    cache: "no-store",
  });
  const payload = (await response.json()) as { session?: TradingUserSession };

  return payload.session;
}

/** @deprecated Use auth `openLogin()` / `completeTradingLogin()` instead. */
export async function connectTradingWallet() {
  const { completeTradingLogin } = await import("@/lib/trading/trading-login");
  const result = await completeTradingLogin();
  return result.session;
}

export async function disconnectTradingSession() {
  await fetch("/api/trading/session", {
    method: "DELETE",
  });
}

export function formatShortWalletAddress(address: string) {
  return address.length > 10 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
}

export function storeConnectedWalletConnector(
  walletAddress: string,
  connectorId: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getProviderStorageKey(walletAddress), connectorId);
}

export function getStoredWalletConnectorId(walletAddress: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage.getItem(getProviderStorageKey(walletAddress)) ?? undefined;
}

export function getStoredTradingWalletProvider(
  walletAddress: string,
): WalletProviderKind | undefined {
  const connectorId = getStoredWalletConnectorId(walletAddress);

  if (!connectorId) {
    return undefined;
  }

  return connectorIdToProviderKind(connectorId);
}

export function getStoredTradingWalletInfo(walletAddress?: string) {
  const walletKind = getStoredTradingWalletProvider(walletAddress ?? "");
  const walletLogos: Record<WalletProviderKind, string> = {
    okx: "/wallets/logo-okx.png",
    metamask: "/wallets/logo-metamask.png",
    injected: "",
  };

  return {
    kind: walletKind,
    logo: walletKind ? walletLogos[walletKind] : undefined,
  };
}

function getProviderStorageKey(walletAddress: string) {
  return `${PROVIDER_STORAGE_PREFIX}:${walletAddress.toLowerCase()}`;
}

export function clearStoredWalletConnectors() {
  if (typeof window === "undefined") {
    return;
  }

  const keysToRemove: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (key?.startsWith(`${PROVIDER_STORAGE_PREFIX}:`)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    window.localStorage.removeItem(key);
  }
}
