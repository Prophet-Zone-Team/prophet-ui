"use client";

import { ensureClobApiReachable } from "@/lib/trading/clob-health-client";
import { fetchJson } from "@/lib/team/client-fetch";
import { signTypedData } from "@/lib/trading/wallet-typed-data-sign";
import type { TradingUserSession } from "@/types/market";

interface TypedDataPayload {
  domain: unknown;
  types: Record<string, unknown>;
  primaryType: string;
  message: Record<string, unknown>;
}

export async function deriveTradingCredentials(
  session: TradingUserSession,
  options?: {
    onChecking?: () => void;
    onAwaitingSignature?: () => void;
    onDeriving?: () => void;
  },
) {
  options?.onChecking?.();
  await ensureClobApiReachable();
  options?.onAwaitingSignature?.();

  const { challenge } = await fetchJson<{ challenge: TypedDataPayload }>(
    "/api/trading/credentials",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ mode: "challenge" })
    }
  );

  const signature = await signTypedData(session.walletAddress, challenge);
  options?.onDeriving?.();

  const response = await fetchJson<{ credentials?: unknown }>(
    "/api/trading/credentials",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        signature,
        timestamp: String(challenge.message.timestamp ?? ""),
        nonce: String(challenge.message.nonce ?? "0")
      })
    }
  );

  if (!response.credentials) {
    throw new Error("User CLOB credentials were not returned.");
  }
}
