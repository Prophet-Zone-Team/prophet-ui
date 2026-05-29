"use client";

import { signMessageWithWallet } from "@/components/trading/wallet-provider";
import { fetchJson } from "@/lib/team/client-fetch";
import {
  buildErc191SignatureResult,
  prepareConfidentialSignedData,
  wrapPayloadAsWalletMessage,
} from "@/lib/confidential/wallet-message";
import type {
  ConfidentialAccountResponse,
  ConfidentialAuthMessageResponse,
  ConfidentialBalancesResponse,
} from "@/types/confidential";
import type { walletMessage } from "@defuse-protocol/internal-utils";

export async function fetchConfidentialAccount() {
  return fetchJson<ConfidentialAccountResponse>("/api/confidential/account");
}

export async function fetchConfidentialBalances() {
  return fetchJson<ConfidentialBalancesResponse>("/api/confidential/balances");
}

export async function requestConfidentialAuthMessage() {
  return fetchJson<ConfidentialAuthMessageResponse>("/api/confidential/auth/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

export async function completeConfidentialAuth(walletAddress: string, signedData: unknown) {
  return fetchJson<ConfidentialAccountResponse & { session?: unknown }>(
    "/api/confidential/auth/complete",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress, signedData }),
    },
  );
}

export { prepareConfidentialSignedData } from "@/lib/confidential/wallet-message";

export async function ensureConfidentialAccount(walletAddress: string) {
  const account = await fetchConfidentialAccount();

  if (account.authStatus === "authenticated") {
    return account;
  }

  const authMessage = await requestConfidentialAuthMessage();
  const signature = await signConfidentialWalletMessage(
    walletAddress,
    authMessage.message as walletMessage.WalletMessage,
  );
  const signedData = prepareConfidentialSignedData(signature, walletAddress);

  return completeConfidentialAuth(walletAddress, signedData);
}

export async function signConfidentialWalletMessage(
  walletAddress: string,
  message: walletMessage.WalletMessage,
) {
  const signedMessage = message.ERC191;
  const signatureHex = await signMessageWithWallet(walletAddress, signedMessage.message);

  return buildErc191SignatureResult(signedMessage, signatureHex);
}

export async function signConfidentialIntentPayload(
  walletAddress: string,
  intentPayload: { standard: string; payload: string | unknown },
) {
  const walletMessage = wrapPayloadAsWalletMessage(intentPayload);
  return signConfidentialWalletMessage(walletAddress, walletMessage);
}

export async function createShieldQuote(amountBaseUnits: string) {
  return fetchJson<{
    depositAddress: string;
    depositMemo?: string;
    quote: unknown;
    ownerWalletAddress: string;
    privateAccountAddress: string;
    polygonUsdcAssetId: string;
  }>("/api/confidential/shield/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountBaseUnits }),
  });
}

export async function generateShieldIntent(depositAddress: string) {
  return fetchJson<{ intent: { standard: string; payload: string | unknown } }>(
    "/api/confidential/shield/intent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositAddress }),
    },
  );
}

export async function submitShieldIntent(depositAddress: string, signedData: unknown) {
  return fetchJson<{ depositAddress: string; ok: boolean }>("/api/confidential/shield/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ depositAddress, signedData }),
  });
}

export async function fetchShieldStatus(depositAddress: string, depositMemo?: string) {
  const search = new URLSearchParams({ depositAddress });

  if (depositMemo) {
    search.set("depositMemo", depositMemo);
  }

  return fetchJson<{ status: string; depositAddress: string }>(
    `/api/confidential/shield/status?${search.toString()}`,
  );
}

export async function createUnshieldQuote(amountBaseUnits: string) {
  return fetchJson<{
    depositAddress: string;
    depositMemo?: string;
    quote: unknown;
    ownerWalletAddress: string;
    privateAccountAddress: string;
    funderAddress: string;
    polygonUsdcAssetId: string;
  }>("/api/confidential/unshield/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountBaseUnits }),
  });
}

export async function generateUnshieldIntent(depositAddress: string) {
  return fetchJson<{ intent: { standard: string; payload: string | unknown } }>(
    "/api/confidential/unshield/intent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositAddress }),
    },
  );
}

export async function submitUnshieldIntent(depositAddress: string, signedData: unknown) {
  return fetchJson<{ depositAddress: string; ok: boolean }>("/api/confidential/unshield/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ depositAddress, signedData }),
  });
}

export async function fetchUnshieldStatus(depositAddress: string, depositMemo?: string) {
  const search = new URLSearchParams({ depositAddress });

  if (depositMemo) {
    search.set("depositMemo", depositMemo);
  }

  return fetchJson<{ status: string; depositAddress: string }>(
    `/api/confidential/unshield/status?${search.toString()}`,
  );
}

export async function pollConfidentialStatus(
  fetchStatus: (depositAddress: string, depositMemo?: string) => Promise<{ status: string }>,
  depositAddress: string,
  depositMemo?: string,
  options?: { maxAttempts?: number; intervalMs?: number },
) {
  const maxAttempts = options?.maxAttempts ?? 120;
  const intervalMs = options?.intervalMs ?? 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const { status } = await fetchStatus(depositAddress, depositMemo);
    const normalized = status.toUpperCase();

    if (normalized === "SUCCESS") {
      return normalized;
    }

    if (normalized === "FAILED" || normalized === "REFUNDED") {
      throw new Error(`Confidential operation failed with status ${normalized}.`);
    }

    await new Promise((resolve) => {
      setTimeout(resolve, intervalMs);
    });
  }

  throw new Error("Confidential operation timed out.");
}
