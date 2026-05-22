"use client";

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

import type { UserOrderSignablePayload } from "../../lib/market/userOrder";

const STORAGE_PREFIX = "wc_quick_bid_signer";
const AUTHORIZATION_GRACE_SECONDS = 90;

export interface QuickBidSessionSigner {
  walletAddress: string;
  address: string;
  privateKey: Hex;
  createdAt: string;
  authorizedUntil?: string;
  authorizationTransactionId?: string;
}

export function getOrCreateQuickBidSessionSigner(walletAddress: string): QuickBidSessionSigner {
  const normalizedWallet = normalizeAddress(walletAddress);
  const existing = readQuickBidSessionSigner(normalizedWallet);

  if (existing) {
    return existing;
  }

  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const signer: QuickBidSessionSigner = {
    walletAddress: normalizedWallet,
    address: account.address,
    privateKey,
    createdAt: new Date().toISOString(),
  };

  writeQuickBidSessionSigner(signer);

  return signer;
}

export function readQuickBidSessionSigner(walletAddress: string): QuickBidSessionSigner | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const normalizedWallet = normalizeAddress(walletAddress);
  const value = window.localStorage.getItem(getStorageKey(normalizedWallet));

  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as Partial<QuickBidSessionSigner>;

    if (!isQuickBidSessionSigner(parsed, normalizedWallet)) {
      return undefined;
    }

    return parsed;
  } catch {
    return undefined;
  }
}

export function writeQuickBidSessionSigner(signer: QuickBidSessionSigner) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(signer.walletAddress), JSON.stringify(signer));
}

export function isQuickBidSessionSignerAuthorized(signer: QuickBidSessionSigner) {
  const validUntil = Number(signer.authorizedUntil);

  return Number.isFinite(validUntil) && validUntil > Math.floor(Date.now() / 1000) + AUTHORIZATION_GRACE_SECONDS;
}

export async function signQuickBidOrder(signable: UserOrderSignablePayload, signer: QuickBidSessionSigner) {
  const account = privateKeyToAccount(signer.privateKey);

  return account.signTypedData({
    domain: signable.domain,
    types: signable.types,
    primaryType: signable.primaryType,
    message: signable.message,
  });
}

function getStorageKey(walletAddress: string) {
  return `${STORAGE_PREFIX}:${walletAddress.toLowerCase()}`;
}

function isQuickBidSessionSigner(
  value: Partial<QuickBidSessionSigner>,
  expectedWallet: string,
): value is QuickBidSessionSigner {
  return (
    value.walletAddress?.toLowerCase() === expectedWallet.toLowerCase() &&
    typeof value.address === "string" &&
    /^0x[a-fA-F0-9]{40}$/.test(value.address) &&
    typeof value.privateKey === "string" &&
    /^0x[a-fA-F0-9]{64}$/.test(value.privateKey) &&
    typeof value.createdAt === "string"
  );
}

function normalizeAddress(address: string) {
  const value = address.trim();

  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error("Invalid wallet address.");
  }

  return value;
}
