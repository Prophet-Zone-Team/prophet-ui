import "server-only";

import { randomBytes } from "crypto";

import { recoverMessageAddress } from "viem";
import type { Hex } from "viem";

const SESSION_AUTH_TTL_MS = 1000 * 60 * 5;
const challenges = new Map<string, TradingSessionChallenge>();

export interface TradingSessionChallenge {
  nonce: string;
  walletAddress: string;
  issuedAt: string;
  expiresAt: string;
  message: string;
}

export function createTradingSessionChallenge(walletAddress: string): TradingSessionChallenge {
  const normalizedWallet = normalizeAddress(walletAddress);
  const issuedAtMs = Date.now();
  const issuedAt = new Date(issuedAtMs).toISOString();
  const expiresAt = new Date(issuedAtMs + SESSION_AUTH_TTL_MS).toISOString();
  const nonce = randomBytes(16).toString("hex");
  const challenge = {
    nonce,
    walletAddress: normalizedWallet,
    issuedAt,
    expiresAt,
    message: [
      "World Cup Prediction Terminal trading session",
      "",
      "Sign this message to connect your wallet for user-owned Polymarket trading.",
      "This does not place an order or move funds.",
      "",
      `Wallet: ${normalizedWallet}`,
      `Nonce: ${nonce}`,
      `Issued At: ${issuedAt}`,
      `Expires At: ${expiresAt}`,
    ].join("\n"),
  };

  challenges.set(challengeKey(normalizedWallet, nonce), challenge);

  return challenge;
}

export async function verifyTradingSessionChallenge({
  walletAddress,
  nonce,
  signature,
}: {
  walletAddress: string;
  nonce: string;
  signature: string;
}) {
  const normalizedWallet = normalizeAddress(walletAddress);
  const key = challengeKey(normalizedWallet, nonce);
  const challenge = challenges.get(key);

  if (!challenge) {
    throw new Error("Trading session challenge was not found or has already been used.");
  }

  challenges.delete(key);

  if (Date.parse(challenge.expiresAt) <= Date.now()) {
    throw new Error("Trading session challenge expired.");
  }

  if (!/^0x[a-fA-F0-9]+$/.test(signature)) {
    throw new Error("Invalid trading session signature.");
  }

  const recoveredAddress = await recoverMessageAddress({
    message: challenge.message,
    signature: signature as Hex,
  });

  if (recoveredAddress.toLowerCase() !== normalizedWallet.toLowerCase()) {
    throw new Error(`Wallet signature recovered ${recoveredAddress}, which does not match ${normalizedWallet}.`);
  }

  return challenge;
}

function challengeKey(walletAddress: string, nonce: string) {
  return `${walletAddress.toLowerCase()}:${nonce}`;
}

function normalizeAddress(address: string) {
  const value = address.trim();

  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error("Invalid wallet address.");
  }

  return value;
}
