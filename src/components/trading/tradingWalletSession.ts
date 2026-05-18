"use client";

import type { TradingUserSession } from "../../types/market";

const DEFAULT_SIGNATURE_TYPE = 3;

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
}

export async function loadTradingSession() {
  const response = await fetch("/api/trading/session", {
    cache: "no-store",
  });
  const payload = (await response.json()) as { session?: TradingUserSession };

  return payload.session;
}

export async function connectTradingWallet() {
  const provider = getEthereumProvider();

  if (!provider) {
    throw new Error("No injected wallet provider found. Install or unlock an EVM wallet, then try again.");
  }

  const accounts = await provider.request({
    method: "eth_requestAccounts",
  });
  const walletAddress = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : undefined;

  if (!walletAddress) {
    throw new Error("Wallet did not return an account.");
  }

  const response = await fetch("/api/trading/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      walletAddress,
      signatureType: DEFAULT_SIGNATURE_TYPE,
    }),
  });
  const payload = (await response.json()) as { session?: TradingUserSession; error?: string };

  if (!response.ok || !payload.session) {
    throw new Error(payload.error ?? "Unable to create a trading session.");
  }

  return payload.session;
}

export async function disconnectTradingSession() {
  await fetch("/api/trading/session", {
    method: "DELETE",
  });
}

export function formatShortWalletAddress(address: string) {
  return address.length > 10 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
}

function getEthereumProvider(): EthereumProvider | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const maybeWindow = window as typeof window & {
    ethereum?: EthereumProvider & { providers?: EthereumProvider[] };
    okxwallet?: EthereumProvider;
  };

  return maybeWindow.ethereum?.providers?.[0] ?? maybeWindow.ethereum ?? maybeWindow.okxwallet;
}
