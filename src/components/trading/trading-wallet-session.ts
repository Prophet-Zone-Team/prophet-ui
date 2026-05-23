"use client";

import type { TradingUserSession } from "@/types/market";
import type { WalletProviderKind } from "@/components/trading/wallet-provider";

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

export function getStoredTradingWalletProvider(walletAddress: string): WalletProviderKind | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const value = window.localStorage.getItem(getProviderStorageKey(walletAddress));

  return value === "okx" || value === "metamask" || value === "injected" ? value : undefined;
}

function writeStoredTradingWalletProvider(walletAddress: string, providerKind: WalletProviderKind) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getProviderStorageKey(walletAddress), providerKind);
}

function getProviderStorageKey(walletAddress: string) {
  return `${PROVIDER_STORAGE_PREFIX}:${walletAddress.toLowerCase()}`;
}
