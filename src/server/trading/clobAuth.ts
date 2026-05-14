import "server-only";

import type { ApiKeyCreds } from "@polymarket/clob-client-v2";
import { recoverTypedDataAddress } from "viem";
import type { Hex } from "viem";

export const DEFAULT_TRADING_HOST = "https://clob.polymarket.com";
const DEFAULT_CHAIN_ID = 137;
const CLOB_AUTH_MESSAGE = "This message attests that I control the given wallet";

interface L1AuthHeaders extends Record<string, string> {
  POLY_ADDRESS: string;
  POLY_SIGNATURE: string;
  POLY_TIMESTAMP: string;
  POLY_NONCE: string;
}

export interface DeriveUserClobCredentialsInput {
  walletAddress: string;
  signature: string;
  timestamp: string;
  nonce?: string | number;
}

export function getTradingHost() {
  return process.env.POLYMARKET_CLOB_HOST?.trim() || DEFAULT_TRADING_HOST;
}

export function getTradingChainId() {
  const parsed = Number.parseInt(process.env.POLYMARKET_CHAIN_ID ?? process.env.CHAIN_ID ?? `${DEFAULT_CHAIN_ID}`, 10);

  return Number.isFinite(parsed) ? parsed : DEFAULT_CHAIN_ID;
}

export function getClobAuthTypedData({
  walletAddress,
  timestamp,
  nonce,
}: {
  walletAddress: string;
  timestamp?: string;
  nonce?: string | number;
}) {
  const normalizedTimestamp = timestamp ?? Math.floor(Date.now() / 1000).toString();
  const normalizedNonce = normalizeNonceValue(nonce);

  return {
    domain: {
      name: "ClobAuthDomain",
      version: "1",
      chainId: getTradingChainId(),
    },
    types: {
      EIP712Domain: [
        {
          name: "name",
          type: "string",
        },
        {
          name: "version",
          type: "string",
        },
        {
          name: "chainId",
          type: "uint256",
        },
      ],
      ClobAuth: [
        {
          name: "address",
          type: "address",
        },
        {
          name: "timestamp",
          type: "string",
        },
        {
          name: "nonce",
          type: "uint256",
        },
        {
          name: "message",
          type: "string",
        },
      ],
    },
    primaryType: "ClobAuth" as const,
    message: {
      address: walletAddress,
      timestamp: normalizedTimestamp,
      nonce: normalizedNonce,
      message: CLOB_AUTH_MESSAGE,
    },
  };
}

export async function getFreshClobAuthTypedData({ walletAddress }: { walletAddress: string }) {
  return getClobAuthTypedData({
    walletAddress,
    timestamp: await fetchClobServerTime(),
  });
}

export async function recoverClobAuthSignerAddress(input: DeriveUserClobCredentialsInput) {
  const challenge = getClobAuthTypedData({
    walletAddress: input.walletAddress,
    timestamp: input.timestamp,
    nonce: input.nonce,
  });

  return recoverTypedDataAddress({
    domain: challenge.domain,
    types: {
      ClobAuth: challenge.types.ClobAuth,
    },
    primaryType: challenge.primaryType,
    message: challenge.message,
    signature: input.signature as Hex,
  });
}

export async function deriveUserClobCredentials(input: DeriveUserClobCredentialsInput): Promise<ApiKeyCreds> {
  const headers = createL1AuthHeaders(input);
  const createResponse = await fetch(`${getTradingHost()}/auth/api-key`, {
    method: "POST",
    headers,
    cache: "no-store",
  });

  if (createResponse.ok) {
    const credentials = tryToApiKeyCreds(await createResponse.json());

    if (credentials) {
      return credentials;
    }
  }

  const createError = createResponse.ok
    ? "CLOB create credential response was missing key, secret, or passphrase."
    : await readResponseError(createResponse);

  const deriveResponse = await fetch(`${getTradingHost()}/auth/derive-api-key`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (deriveResponse.ok) {
    return toApiKeyCreds(await deriveResponse.json());
  }

  throw new Error(
    `Unable to create or derive user CLOB credentials. create: ${createError}; derive: ${await readResponseError(
      deriveResponse,
    )}`,
  );
}

async function fetchClobServerTime() {
  const response = await fetch(`${getTradingHost()}/time`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return Math.floor(Date.now() / 1000).toString();
  }

  const text = (await response.text()).trim();
  const parsed = Number.parseInt(text, 10);

  return Number.isFinite(parsed) ? parsed.toString() : Math.floor(Date.now() / 1000).toString();
}

function createL1AuthHeaders(input: DeriveUserClobCredentialsInput): L1AuthHeaders {
  const nonce = normalizeNonceString(input.nonce);

  if (!/^0x[a-fA-F0-9]{40}$/.test(input.walletAddress)) {
    throw new Error("Invalid wallet address.");
  }

  if (!/^0x[a-fA-F0-9]+$/.test(input.signature)) {
    throw new Error("Invalid wallet signature.");
  }

  if (!/^\d+$/.test(input.timestamp)) {
    throw new Error("Invalid CLOB auth timestamp.");
  }

  if (!/^\d+$/.test(nonce)) {
    throw new Error("Invalid CLOB auth nonce.");
  }

  return {
    POLY_ADDRESS: input.walletAddress,
    POLY_SIGNATURE: input.signature,
    POLY_TIMESTAMP: input.timestamp,
    POLY_NONCE: nonce,
  };
}

function toApiKeyCreds(payload: unknown): ApiKeyCreds {
  const credentials = tryToApiKeyCreds(payload);

  if (!credentials) {
    throw new Error("CLOB credential response is missing key, secret, or passphrase.");
  }

  return credentials;
}

function tryToApiKeyCreds(payload: unknown): ApiKeyCreds | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const key = getString(record.key) ?? getString(record.apiKey);
  const secret = getString(record.secret);
  const passphrase = getString(record.passphrase);

  if (!key || !secret || !passphrase) {
    return undefined;
  }

  return {
    key,
    secret,
    passphrase,
  };
}

function normalizeNonceValue(nonce: string | number | undefined): number {
  if (nonce === undefined || nonce === "") {
    return 0;
  }

  const parsed = typeof nonce === "number" ? nonce : Number.parseInt(nonce, 10);

  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeNonceString(nonce: string | number | undefined): string {
  return normalizeNonceValue(nonce).toString();
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function readResponseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string; errorMsg?: string; message?: string };
    const message = payload.error ?? payload.errorMsg ?? payload.message;

    return message ? `${response.status} ${message}` : `${response.status} ${response.statusText}`;
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}
