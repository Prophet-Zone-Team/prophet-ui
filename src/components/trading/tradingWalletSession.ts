"use client";

import type { TradingUserSession } from "../../types/market";
import {
  getEthereumProvider,
  getEthereumProviderForWallet,
  getProviderKind,
  type EthereumProvider,
  type WalletProviderKind,
} from "./walletProvider";

const DEFAULT_SIGNATURE_TYPE = 3;
const PROVIDER_STORAGE_PREFIX = "wc_trading_wallet_provider";

interface TradingSessionChallenge {
  nonce: string;
  walletAddress: string;
  message: string;
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

  const challengeResponse = await fetch("/api/trading/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode: "challenge",
      walletAddress,
    }),
  });
  const challengePayload = (await challengeResponse.json()) as {
    challenge?: TradingSessionChallenge;
    error?: string;
  };

  if (!challengeResponse.ok || !challengePayload.challenge) {
    throw new Error(challengePayload.error ?? "Unable to create a trading session challenge.");
  }

  const signingProvider = await getEthereumProviderForWallet(walletAddress, getStoredTradingWalletProvider(walletAddress));
  const signature = await signTradingSessionMessage({
    provider: signingProvider,
    walletAddress,
    message: challengePayload.challenge.message,
  });
  const response = await fetch("/api/trading/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode: "create",
      walletAddress,
      nonce: challengePayload.challenge.nonce,
      signature,
      signatureType: DEFAULT_SIGNATURE_TYPE,
    }),
  });
  const payload = (await response.json()) as { session?: TradingUserSession; error?: string };

  if (!response.ok || !payload.session) {
    throw new Error(payload.error ?? "Unable to create a trading session.");
  }

  writeStoredTradingWalletProvider(payload.session.walletAddress, getProviderKind(signingProvider));

  return payload.session;
}

async function signTradingSessionMessage({
  provider,
  walletAddress,
  message,
}: {
  provider: EthereumProvider;
  walletAddress: string;
  message: string;
}) {
  try {
    const signature = await provider.request({
      method: "personal_sign",
      params: [message, walletAddress],
    });

    if (typeof signature === "string") {
      return signature;
    }
  } catch (error) {
    if (isUserRejectedRequest(error)) {
      throw error;
    }

    const fallbackSignature = await provider.request({
      method: "personal_sign",
      params: [walletAddress, message],
    });

    if (typeof fallbackSignature === "string") {
      return fallbackSignature;
    }

    throw error;
  }

  throw new Error("Wallet did not return a trading session signature.");
}

function isUserRejectedRequest(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    Number((error as { code?: unknown }).code) === 4001
  );
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
