import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

import { recoverMessageAddress } from "viem";
import type { Hex } from "viem";

const SESSION_AUTH_TTL_MS = 1000 * 60 * 5;

export interface TradingSessionChallenge {
  nonce: string;
  walletAddress: string;
  issuedAt: string;
  expiresAt: string;
  message: string;
  token: string;
}

export function createTradingSessionChallenge(walletAddress: string): TradingSessionChallenge {
  const normalizedWallet = normalizeAddress(walletAddress);
  const issuedAtMs = Date.now();
  const issuedAt = new Date(issuedAtMs).toISOString();
  const expiresAt = new Date(issuedAtMs + SESSION_AUTH_TTL_MS).toISOString();
  const nonce = randomBytes(16).toString("hex");
  const message = [
    "World Cup Prediction Terminal trading session",
    "",
    "Sign this message to connect your wallet for user-owned Polymarket trading.",
    "This does not place an order or move funds.",
    "",
    `Wallet: ${normalizedWallet}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expires At: ${expiresAt}`,
  ].join("\n");
  const challenge = {
    nonce,
    walletAddress: normalizedWallet,
    issuedAt,
    expiresAt,
    message,
    token: signChallengeToken({
      nonce,
      walletAddress: normalizedWallet,
      issuedAt,
      expiresAt,
      message,
    }),
  };

  return challenge;
}

export async function verifyTradingSessionChallenge({
  walletAddress,
  token,
  signature,
}: {
  walletAddress: string;
  token: string;
  signature: string;
}) {
  const normalizedWallet = normalizeAddress(walletAddress);
  const challenge = verifyChallengeToken(token);

  if (challenge.walletAddress.toLowerCase() !== normalizedWallet.toLowerCase()) {
    throw new Error("Trading session challenge wallet does not match the connected wallet.");
  }

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

interface SignedChallengePayload {
  nonce: string;
  walletAddress: string;
  issuedAt: string;
  expiresAt: string;
  message: string;
}

function signChallengeToken(payload: SignedChallengePayload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", getChallengeSigningKey()).update(body).digest("base64url");

  return `${body}.${signature}`;
}

function verifyChallengeToken(token: string): SignedChallengePayload {
  const [body, signature] = token.split(".");

  if (!body || !signature) {
    throw new Error("Trading session challenge was not found or has already been used.");
  }

  const expected = createHmac("sha256", getChallengeSigningKey()).update(body).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new Error("Trading session challenge was not found or has already been used.");
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<SignedChallengePayload>;

  if (
    typeof payload.nonce !== "string" ||
    !/^[a-f0-9]{32}$/.test(payload.nonce) ||
    typeof payload.walletAddress !== "string" ||
    !/^0x[a-fA-F0-9]{40}$/.test(payload.walletAddress) ||
    typeof payload.issuedAt !== "string" ||
    typeof payload.expiresAt !== "string" ||
    typeof payload.message !== "string" ||
    !payload.message.includes(payload.nonce)
  ) {
    throw new Error("Trading session challenge was not found or has already been used.");
  }

  return payload as SignedChallengePayload;
}

function getChallengeSigningKey() {
  const secret =
    process.env.TRADING_SESSION_SECRET?.trim() ??
    process.env.AUTH_SECRET?.trim() ??
    process.env.NEXTAUTH_SECRET?.trim() ??
    process.env.POLYMARKET_BUILDER_SECRET?.trim();

  if (!secret) {
    throw new Error("TRADING_SESSION_SECRET is required for trading session authentication.");
  }

  return createHash("sha256").update(secret).digest();
}

function normalizeAddress(address: string) {
  const value = address.trim();

  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error("Invalid wallet address.");
  }

  return value;
}
