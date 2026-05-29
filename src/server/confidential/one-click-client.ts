import "server-only";

import { OpenAPI, OneClickService, QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript";

import { getOneClickConfig } from "@/server/confidential/config";
import type { ConfidentialSessionRecord } from "@/server/confidential/session-store";

type ConfidentialDepositType = "ORIGIN_CHAIN" | "INTENTS" | "CONFIDENTIAL_INTENTS";
type ConfidentialRecipientType = "DESTINATION_CHAIN" | "INTENTS" | "CONFIDENTIAL_INTENTS";
type ConfidentialRefundType = "ORIGIN_CHAIN" | "INTENTS" | "CONFIDENTIAL_INTENTS";

export interface ConfidentialQuoteParams {
  dry?: boolean;
  swapType?: QuoteRequest.swapType;
  slippageTolerance?: number;
  originAsset: string;
  destinationAsset: string;
  amount: string;
  depositType: ConfidentialDepositType;
  recipientType: ConfidentialRecipientType;
  refundType: ConfidentialRefundType;
  refundTo: string;
  recipient: string;
  deadline?: string;
  quoteWaitingTimeMs?: number;
}

let openApiInitialized = false;

function ensureOpenApi(session?: ConfidentialSessionRecord) {
  const config = getOneClickConfig();

  OpenAPI.BASE = config.baseUrl;
  OpenAPI.HEADERS = {
    "x-api-key": config.apiKey,
  };

  if (session) {
    OpenAPI.TOKEN = async () => session.accessToken;
  } else {
    OpenAPI.TOKEN = undefined;
  }

  openApiInitialized = true;

  if (!openApiInitialized) {
    throw new Error("Failed to initialize OneClick OpenAPI client.");
  }
}

export async function oneClickGetTokens(session: ConfidentialSessionRecord) {
  ensureOpenApi(session);
  return OneClickService.getTokens();
}

export async function oneClickGetQuote(
  session: ConfidentialSessionRecord,
  params: ConfidentialQuoteParams,
) {
  ensureOpenApi(session);

  const requestBody = {
    dry: params.dry ?? false,
    swapType: params.swapType ?? QuoteRequest.swapType.EXACT_INPUT,
    slippageTolerance: params.slippageTolerance ?? 100,
    originAsset: params.originAsset,
    destinationAsset: params.destinationAsset,
    amount: params.amount,
    depositType: params.depositType as QuoteRequest.depositType,
    recipientType: params.recipientType as QuoteRequest.recipientType,
    refundType: params.refundType as QuoteRequest.refundType,
    refundTo: params.refundTo,
    recipient: params.recipient,
    deadline: params.deadline ?? new Date(Date.now() + 5 * 60_000).toISOString(),
    quoteWaitingTimeMs: params.quoteWaitingTimeMs ?? 0,
  } as QuoteRequest;

  return OneClickService.getQuote(requestBody);
}

export async function oneClickGetExecutionStatus(
  session: ConfidentialSessionRecord,
  depositAddress: string,
  depositMemo?: string,
) {
  ensureOpenApi(session);
  return OneClickService.getExecutionStatus(depositAddress, depositMemo);
}

export async function oneClickSubmitDepositTx(
  session: ConfidentialSessionRecord,
  payload: { depositAddress: string; txHash: string; memo?: string },
) {
  ensureOpenApi(session);
  return OneClickService.submitDepositTx({
    depositAddress: payload.depositAddress,
    txHash: payload.txHash,
    memo: payload.memo,
  });
}

export async function oneClickFetch<T>(
  session: ConfidentialSessionRecord,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const config = getOneClickConfig();
  const headers = new Headers(init?.headers);

  headers.set("Content-Type", "application/json");
  headers.set("x-api-key", config.apiKey);
  headers.set("Authorization", `Bearer ${session.accessToken}`);

  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OneClick ${path} failed (${response.status}): ${text}`);
  }

  return (await response.json()) as T;
}

export async function oneClickGetBalances(session: ConfidentialSessionRecord) {
  return oneClickFetch<{ balances: Array<{ tokenId: string; available: string; source?: string }> }>(
    session,
    "/v0/account/balances",
    { method: "GET" },
  );
}

export async function oneClickGenerateIntent(
  session: ConfidentialSessionRecord,
  payload: {
    depositAddress: string;
    signerId: string;
    standard: string;
  },
) {
  return oneClickFetch<{ intent: unknown }>(session, "/v0/intent/generate", {
    method: "POST",
    body: JSON.stringify({
      type: "swap_transfer",
      standard: payload.standard,
      depositAddress: payload.depositAddress,
      signerId: payload.signerId,
    }),
  });
}

export async function oneClickSubmitIntent(
  session: ConfidentialSessionRecord,
  signedData: unknown,
) {
  return oneClickFetch<unknown>(session, "/v0/intent/submit", {
    method: "POST",
    body: JSON.stringify({
      type: "swap_transfer",
      signedData,
    }),
  });
}

export async function oneClickAuthenticate(signedData: unknown) {
  const config = getOneClickConfig();

  const response = await fetch(`${config.baseUrl}/v0/auth/authenticate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
    },
    body: JSON.stringify({ signedData }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Confidential authenticate failed (${response.status}): ${text}`);
  }

  return (await response.json()) as {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshExpiresIn?: number;
  };
}

export async function oneClickRefresh(refreshToken: string) {
  const config = getOneClickConfig();

  const response = await fetch(`${config.baseUrl}/v0/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Confidential refresh failed (${response.status}): ${text}`);
  }

  return (await response.json()) as {
    accessToken: string;
    expiresIn: number;
    refreshToken?: string;
  };
}
