import "server-only";

import { TransactionType } from "@polymarket/builder-relayer-client";
import { type Address } from "viem";

import { getFundingPublicClient } from "@/lib/funding/funding-chain-client";
import { POLYGON_CHAIN_ID } from "@/lib/market/polymarket-collateral-contracts";
import { serverFetch } from "@/server/trading/server-fetch";

const DEFAULT_RELAYER_URL = "https://relayer-v2.polymarket.com";
const RELAYER_TIMEOUT_MS = 8000;

interface RelayerPayloadResponse {
  address?: string;
  nonce?: string;
}

const SAFE_NONCE_ABI = [
  {
    name: "nonce",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export async function fetchRelayerPayload(ownerAddress: string, signerType: TransactionType) {
  const url = new URL(`${getRelayerUrl()}/relay-payload`);
  url.searchParams.set("address", ownerAddress);
  url.searchParams.set("type", signerType);
  const response = await serverFetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(RELAYER_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Unable to read relayer payload: ${await readResponseError(response)}`);
  }

  const payload = (await response.json()) as RelayerPayloadResponse;

  if (
    !payload.address ||
    !/^0x[a-fA-F0-9]{40}$/.test(payload.address) ||
    !payload.nonce ||
    !/^\d+$/.test(payload.nonce)
  ) {
    throw new Error("Relayer payload response is missing address or numeric nonce.");
  }

  return {
    address: payload.address,
    nonce: payload.nonce,
  };
}

export async function fetchSafeNonce(safeAddress: string): Promise<string> {
  const client = getFundingPublicClient(POLYGON_CHAIN_ID);
  const nonce = await client.readContract({
    address: safeAddress as Address,
    abi: SAFE_NONCE_ABI,
    functionName: "nonce",
  });

  return nonce.toString();
}

function getRelayerUrl() {
  return (process.env.POLYMARKET_RELAYER_URL ?? process.env.RELAYER_URL ?? DEFAULT_RELAYER_URL)
    .trim()
    .replace(/\/$/, "");
}

async function readResponseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error?: string;
      errorMsg?: string;
      message?: string;
    };

    return payload.error ?? payload.errorMsg ?? payload.message ?? `${response.status} ${response.statusText}`;
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}
