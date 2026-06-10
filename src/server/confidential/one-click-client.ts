import "server-only";

import type {
  GetExecutionStatusResponse,
  QuoteResponse,
  SubmitDepositTxResponse,
  TokenResponse,
} from "@defuse-protocol/one-click-sdk-typescript";

import type { ConfidentialQuoteRequest } from "@/lib/funding/confidential";

import { getConfidentialEnv } from "./env";

const ONE_CLICK_PATHS = {
  tokens: "/v0/tokens",
  quote: "/v0/quote",
  status: "/v0/status",
  submitDeposit: "/v0/deposit/submit",
  balances: "/v0/account/balances",
  generateIntent: "/v0/generate-intent",
  submitIntent: "/v0/submit-intent",
  authenticate: "/v0/auth/authenticate",
  refresh: "/v0/auth/refresh",
} as const;

export interface OneClickAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn?: number;
}

export interface OneClickRefreshTokens {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
  refreshExpiresIn?: number;
}

export interface OneClickBalanceEntry {
  tokenId?: string;
  assetId?: string;
  available?: string;
  amount?: string;
  balance?: string;
}

export interface OneClickBalancesResponse {
  balances?: OneClickBalanceEntry[];
}

export interface GenerateIntentRequest {
  type: "swap_transfer";
  standard: string;
  depositAddress: string;
  signerId: string;
}

export interface GenerateIntentResponse {
  intent: ConfidentialMultiPayload;
}

export interface ConfidentialMultiPayload {
  standard: string;
  payload: unknown;
}

export interface SubmitIntentRequest {
  type: "swap_transfer";
  signedData: unknown;
}

interface OneClickFetchOptions {
  method: "GET" | "POST";
  body?: unknown;
  bearer?: string;
  query?: Record<string, string | undefined>;
}

async function oneClickFetch<T>(path: string, options: OneClickFetchOptions): Promise<T> {
  const env = getConfidentialEnv();
  const url = new URL(`${env.oneClickUrl}${path}`);

  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }

  const headers: Record<string, string> = {
    "x-api-key": env.oneClickApiKey,
    Accept: "application/json",
  };

  if (options.bearer) {
    headers.Authorization = `Bearer ${options.bearer}`;
  }

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url.toString(), {
    method: options.method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  let parsed: unknown;

  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { message: text };
  }

  if (!response.ok) {
    const message =
      (parsed as { message?: string; error?: string }).message ??
      (parsed as { error?: string }).error ??
      `1Click request failed: ${response.status}`;
    throw new OneClickError(message, response.status);
  }

  return parsed as T;
}

export class OneClickError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "OneClickError";
  }
}

export function getConfidentialTokens(): Promise<TokenResponse[]> {
  return oneClickFetch<TokenResponse[]>(ONE_CLICK_PATHS.tokens, { method: "GET" });
}

export function getConfidentialQuote(
  body: ConfidentialQuoteRequest,
  bearer: string,
): Promise<QuoteResponse> {
  return oneClickFetch<QuoteResponse>(ONE_CLICK_PATHS.quote, {
    method: "POST",
    body,
    bearer,
  });
}

export function getConfidentialExecutionStatus(
  depositAddress: string,
  depositMemo: string | undefined,
  bearer: string,
): Promise<GetExecutionStatusResponse> {
  return oneClickFetch<GetExecutionStatusResponse>(ONE_CLICK_PATHS.status, {
    method: "GET",
    bearer,
    query: { depositAddress, depositMemo },
  });
}

export function submitConfidentialDepositTx(
  body: { txHash: string; depositAddress: string; memo?: string },
  bearer: string,
): Promise<SubmitDepositTxResponse> {
  return oneClickFetch<SubmitDepositTxResponse>(ONE_CLICK_PATHS.submitDeposit, {
    method: "POST",
    body,
    bearer,
  });
}

export function getConfidentialBalances(bearer: string): Promise<OneClickBalancesResponse> {
  return oneClickFetch<OneClickBalancesResponse>(ONE_CLICK_PATHS.balances, {
    method: "GET",
    bearer,
  });
}

export function generateConfidentialIntent(
  body: GenerateIntentRequest,
  bearer: string,
): Promise<GenerateIntentResponse> {
  return oneClickFetch<GenerateIntentResponse>(ONE_CLICK_PATHS.generateIntent, {
    method: "POST",
    body,
    bearer,
  });
}

export function submitConfidentialIntent(
  body: SubmitIntentRequest,
  bearer: string,
): Promise<SubmitDepositTxResponse> {
  return oneClickFetch<SubmitDepositTxResponse>(ONE_CLICK_PATHS.submitIntent, {
    method: "POST",
    body,
    bearer,
  });
}

export function authenticateOneClick(signedData: unknown): Promise<OneClickAuthTokens> {
  return oneClickFetch<OneClickAuthTokens>(ONE_CLICK_PATHS.authenticate, {
    method: "POST",
    body: { signedData },
  });
}

export function refreshOneClickToken(refreshToken: string): Promise<OneClickRefreshTokens> {
  return oneClickFetch<OneClickRefreshTokens>(ONE_CLICK_PATHS.refresh, {
    method: "POST",
    body: { refreshToken },
  });
}
