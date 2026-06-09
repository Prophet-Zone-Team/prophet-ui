import "server-only";

import { getPolymarketBuilderCode } from "@/server/trading/builder-code";
import { serverFetch } from "@/server/trading/server-fetch";
import type { BridgeQuoteRequest, BridgeQuoteResponse, SupportedAssetsPayload } from "@/types/funding";

const DEFAULT_BRIDGE_URL = "https://bridge.polymarket.com";
const BRIDGE_TIMEOUT_MS = 8000;

export interface BridgeDepositAddresses {
  evm?: string;
  svm?: string;
  btc?: string;
  tvm?: string;
}

export interface BridgeDepositAddressResponse {
  address: BridgeDepositAddresses;
  note?: string;
}

export interface BridgeWithdrawRequest {
  address: string;
  toChainId: string;
  toTokenAddress: string;
  recipientAddr: string;
}

export interface BridgeStatusResponse {
  transactions?: Array<Record<string, unknown>>;
}

export async function createBridgeDepositAddresses(walletAddress: string): Promise<BridgeDepositAddressResponse> {
  const response = await serverFetch(`${getBridgeUrl()}/deposit`, {
    method: "POST",
    headers: createBridgeHeaders(),
    body: JSON.stringify({
      address: walletAddress,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(BRIDGE_TIMEOUT_MS),
  });

  return readBridgeJsonResponse<BridgeDepositAddressResponse>(
    response,
    "Unable to create Polymarket deposit addresses",
  );
}

export async function createBridgeWithdrawalAddresses(
  payload: BridgeWithdrawRequest,
): Promise<BridgeDepositAddressResponse> {
  const response = await serverFetch(`${getBridgeUrl()}/withdraw`, {
    method: "POST",
    headers: createBridgeHeaders(),
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(BRIDGE_TIMEOUT_MS),
  });

  return readBridgeJsonResponse<BridgeDepositAddressResponse>(
    response,
    "Unable to create Polymarket withdrawal addresses",
  );
}

export async function fetchBridgeSupportedAssets(): Promise<SupportedAssetsPayload> {
  const response = await serverFetch(`${getBridgeUrl()}/supported-assets`, {
    cache: "no-store",
    signal: AbortSignal.timeout(BRIDGE_TIMEOUT_MS),
  });

  return readBridgeJsonResponse<SupportedAssetsPayload>(
    response,
    "Unable to read Polymarket supported assets",
  );
}

export async function fetchBridgeQuote(body: BridgeQuoteRequest): Promise<BridgeQuoteResponse> {
  const response = await serverFetch(`${getBridgeUrl()}/quote`, {
    method: "POST",
    headers: createBridgeHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(BRIDGE_TIMEOUT_MS),
  });

  return readBridgeJsonResponse<BridgeQuoteResponse>(response, "Unable to fetch Polymarket bridge quote");
}

export async function fetchBridgeTransactionStatus(depositAddress: string): Promise<BridgeStatusResponse> {
  const response = await serverFetch(`${getBridgeUrl()}/status/${encodeURIComponent(depositAddress)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(BRIDGE_TIMEOUT_MS),
  });

  return readBridgeJsonResponse<BridgeStatusResponse>(
    response,
    "Unable to read Polymarket bridge status",
  );
}

/** @deprecated Use fetchBridgeTransactionStatus */
export const fetchBridgeDepositStatus = fetchBridgeTransactionStatus;

function getBridgeUrl() {
  return (process.env.POLYMARKET_BRIDGE_URL ?? DEFAULT_BRIDGE_URL).trim().replace(/\/$/, "");
}

function createBridgeHeaders() {
  const builderCode = getPolymarketBuilderCode();

  return {
    "Content-Type": "application/json",
    ...(builderCode ? { "X-Builder-Code": builderCode } : {}),
  };
}

async function readBridgeJsonResponse<T>(response: Response, errorPrefix: string): Promise<T> {
  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`${errorPrefix}: ${formatBridgeErrorMessage(bodyText, response)}`);
  }

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    throw new Error(`${errorPrefix}: invalid JSON response.`);
  }
}

function formatBridgeErrorMessage(bodyText: string, response: Response): string {
  const trimmed = bodyText.trim();

  if (!trimmed) {
    return `${response.status} ${response.statusText}`;
  }

  try {
    const payload = JSON.parse(trimmed) as { error?: string; errorMsg?: string; message?: string };

    return payload.error ?? payload.errorMsg ?? payload.message ?? trimmed;
  } catch {
    return trimmed;
  }
}
