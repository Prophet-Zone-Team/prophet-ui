import "server-only";

import { getPolymarketBuilderCode } from "./builderCode";

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

export interface BridgeStatusResponse {
  transactions?: Array<Record<string, unknown>>;
}

export async function createBridgeDepositAddresses(walletAddress: string): Promise<BridgeDepositAddressResponse> {
  const response = await fetch(`${getBridgeUrl()}/deposit`, {
    method: "POST",
    headers: createBridgeHeaders(),
    body: JSON.stringify({
      address: walletAddress,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(BRIDGE_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Unable to create Polymarket deposit addresses: ${await readResponseError(response)}`);
  }

  return (await response.json()) as BridgeDepositAddressResponse;
}

export async function fetchBridgeDepositStatus(depositAddress: string): Promise<BridgeStatusResponse> {
  const response = await fetch(`${getBridgeUrl()}/status/${encodeURIComponent(depositAddress)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(BRIDGE_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Unable to read Polymarket deposit status: ${await readResponseError(response)}`);
  }

  return (await response.json()) as BridgeStatusResponse;
}

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

async function readResponseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string; errorMsg?: string; message?: string };

    return payload.error ?? payload.errorMsg ?? payload.message ?? `${response.status} ${response.statusText}`;
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}
