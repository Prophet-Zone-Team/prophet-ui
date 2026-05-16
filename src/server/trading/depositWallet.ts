import "server-only";

import { deriveDepositWallet, TransactionType } from "@polymarket/builder-relayer-client";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";

import type { DepositWalletStatus, TradingUserSession } from "../../types/market";
import { getTradingChainId } from "./clobAuth";

const DEFAULT_RELAYER_URL = "https://relayer-v2.polymarket.com";
const RELAYER_TIMEOUT_MS = 8000;
const DEPOSIT_WALLET_CONTRACTS = {
  137: {
    factory: "0x00000000000Fb5C9ADea0298D729A0CB3823Cc07",
    implementation: "0x58CA52ebe0DadfdF531Cde7062e76746de4Db1eB",
  },
  80002: {
    factory: "0x00000000000Fb5C9ADea0298D729A0CB3823Cc07",
    implementation: "0x50a88fE9a441cB4c9c2aD6A2207CE2795C7D7Fbd",
  },
} as const;

export interface DepositWalletSetupResult {
  walletAddress: string;
  status: DepositWalletStatus;
  checkedAt: string;
  transactionId?: string;
  transactionHash?: string;
  error?: string;
}

export interface DepositWalletDeploymentRefresh {
  status: DepositWalletStatus;
  checkedAt: string;
  transactionHash?: string;
  error?: string;
}

export interface RelayerSubmitResponse {
  transactionID?: string;
  state?: string;
  hash?: string;
  transactionHash?: string;
}

interface RelayerNonceResponse {
  nonce?: string;
}

interface RelayerTransactionRecord {
  transactionID?: string;
  transactionHash?: string;
  proxyAddress?: string;
  state?: string;
  type?: string;
}

export async function setupDepositWalletForOwner(ownerAddress: string): Promise<DepositWalletSetupResult> {
  const walletAddress = deriveDepositWalletForOwner(ownerAddress);
  const checkedAt = new Date().toISOString();

  try {
    const deployed = await fetchDepositWalletDeployed(walletAddress);

    if (deployed) {
      return {
        walletAddress,
        status: "deployed",
        checkedAt,
      };
    }

    const relayerStatus = getRelayerConfigStatusForOwner(ownerAddress);

    if (!relayerStatus.configured) {
      return {
        walletAddress,
        status: "relayer_unconfigured",
        checkedAt,
        error: relayerStatus.error ?? "Polymarket relayer credentials are not configured.",
      };
    }

    const response = await submitDepositWalletCreate(ownerAddress);

    return {
      walletAddress,
      status: "deploying",
      checkedAt,
      transactionId: response.transactionID,
      transactionHash: response.transactionHash ?? response.hash,
    };
  } catch (error) {
    return {
      walletAddress,
      status: "error",
      checkedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function refreshDepositWalletDeployment(session: TradingUserSession): Promise<DepositWalletDeploymentRefresh> {
  const checkedAt = new Date().toISOString();

  if (!session.funderAddress) {
    return {
      status: "unknown",
      checkedAt,
      error: "Session is missing a deposit wallet address.",
    };
  }

  try {
    const deployed = await fetchDepositWalletDeployed(session.funderAddress);

    if (deployed) {
      return {
        status: "deployed",
        checkedAt,
      };
    }

    if (!session.depositWalletTransactionId) {
      const relayerStatus = getRelayerConfigStatusForOwner(session.walletAddress);

      if (!relayerStatus.configured) {
        return {
          status: "relayer_unconfigured",
          checkedAt,
          error: relayerStatus.error ?? "Polymarket relayer credentials are not configured.",
        };
      }

      return {
        status: "derived",
        checkedAt,
      };
    }

    const transaction = await fetchRelayerTransaction(session.depositWalletTransactionId);
    const state = transaction?.state;

    if (state === "STATE_MINED" || state === "STATE_CONFIRMED" || state === "STATE_EXECUTED") {
      return {
        status: "deployed",
        checkedAt,
        transactionHash: transaction?.transactionHash,
      };
    }

    if (state === "STATE_FAILED" || state === "STATE_INVALID") {
      return {
        status: "error",
        checkedAt,
        transactionHash: transaction?.transactionHash,
        error: `Deposit wallet deployment ${state}.`,
      };
    }

    return {
      status: "deploying",
      checkedAt,
      transactionHash: transaction?.transactionHash,
    };
  } catch (error) {
    return {
      status: "error",
      checkedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function deriveDepositWalletForOwner(ownerAddress: string) {
  const config = getDepositWalletContractConfig();

  return deriveDepositWallet(ownerAddress, config.factory, config.implementation);
}

export function getRelayerConfigStatus() {
  return getRelayerConfigStatusForOwner();
}

export function getRelayerConfigStatusForOwner(ownerAddress?: string) {
  const relayerCreds = getRelayerApiKeyCredentials();
  const builderCreds = getBuilderApiKeyCredentials();
  const relayerMatchesOwner = relayerCreds && ownerAddress ? isSameAddress(relayerCreds.address, ownerAddress) : Boolean(relayerCreds);
  const authType = relayerMatchesOwner ? "relayer_api_key" : builderCreds ? "builder_api_key" : "none";
  const mismatchError =
    relayerCreds && ownerAddress && !relayerMatchesOwner && !builderCreds
      ? `Configured RELAYER_API_KEY_ADDRESS ${relayerCreds.address} does not match connected wallet ${ownerAddress}. Configure Builder API credentials for app-managed deposit wallet setup, or use a relayer key owned by the connected wallet.`
      : undefined;

  return {
    configured: authType !== "none",
    authType,
    error: mismatchError,
    relayerUrl: getRelayerUrl(),
  };
}

export async function fetchRelayerNonce(ownerAddress: string, signerType: TransactionType = TransactionType.WALLET) {
  const url = new URL(`${getRelayerUrl()}/nonce`);
  url.searchParams.set("address", ownerAddress);
  url.searchParams.set("type", signerType);
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(RELAYER_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Unable to read relayer nonce: ${await readResponseError(response)}`);
  }

  const payload = (await response.json()) as RelayerNonceResponse;

  if (!payload.nonce || !/^\d+$/.test(payload.nonce)) {
    throw new Error("Relayer nonce response is missing a numeric nonce.");
  }

  return payload.nonce;
}

async function fetchDepositWalletDeployed(walletAddress: string) {
  const url = new URL(`${getRelayerUrl()}/deployed`);
  url.searchParams.set("address", walletAddress);
  url.searchParams.set("type", TransactionType.WALLET);
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(RELAYER_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Unable to check deposit wallet deployment: ${await readResponseError(response)}`);
  }

  const payload = (await response.json()) as { deployed?: boolean };

  return payload.deployed === true;
}

async function submitDepositWalletCreate(ownerAddress: string): Promise<RelayerSubmitResponse> {
  const config = getDepositWalletContractConfig();
  const body = JSON.stringify({
    type: TransactionType.WALLET_CREATE,
    from: ownerAddress,
    to: config.factory,
  });

  return submitRelayerTransaction(body, "Unable to deploy deposit wallet");
}

export async function submitRelayerTransaction(body: string, errorPrefix = "Unable to submit relayer transaction"): Promise<RelayerSubmitResponse> {
  const response = await fetch(`${getRelayerUrl()}/submit`, {
    method: "POST",
    headers: await createRelayerHeaders("POST", "/submit", body),
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(RELAYER_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`${errorPrefix}: ${await readResponseError(response)}`);
  }

  return (await response.json()) as RelayerSubmitResponse;
}

export function buildDepositWalletBatchRequest({
  ownerAddress,
  walletAddress,
  nonce,
  deadline,
  calls,
  signature,
}: {
  ownerAddress: string;
  walletAddress: string;
  nonce: string;
  deadline: string;
  calls: Array<{
    target: string;
    value: string;
    data: string;
  }>;
  signature: string;
}) {
  const config = getDepositWalletContractConfig();

  return {
    type: TransactionType.WALLET,
    from: ownerAddress,
    to: config.factory,
    nonce,
    signature,
    depositWalletParams: {
      depositWallet: walletAddress,
      deadline,
      calls,
    },
  };
}

function getDepositWalletContractConfig() {
  const chainId = getTradingChainId();
  const config = DEPOSIT_WALLET_CONTRACTS[chainId as keyof typeof DEPOSIT_WALLET_CONTRACTS];

  if (!config) {
    throw new Error(`Deposit wallet contracts are not configured for chain ${chainId}.`);
  }

  return config;
}

export async function fetchRelayerTransaction(transactionId: string): Promise<RelayerTransactionRecord | undefined> {
  const url = new URL(`${getRelayerUrl()}/transaction`);
  url.searchParams.set("id", transactionId);
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(RELAYER_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Unable to read deposit wallet deployment transaction: ${await readResponseError(response)}`);
  }

  const payload = (await response.json()) as RelayerTransactionRecord[] | RelayerTransactionRecord;

  return Array.isArray(payload) ? payload[0] : payload;
}

async function createRelayerHeaders(method: string, path: string, body: string): Promise<Record<string, string>> {
  const relayerCreds = getRelayerApiKeyCredentials();
  const fromAddress = parseSubmitFromAddress(body);

  if (relayerCreds && (!fromAddress || isSameAddress(relayerCreds.address, fromAddress))) {
    return {
      "Content-Type": "application/json",
      RELAYER_API_KEY: relayerCreds.key,
      RELAYER_API_KEY_ADDRESS: relayerCreds.address,
    };
  }

  const builderCreds = getBuilderApiKeyCredentials();

  if (!builderCreds) {
    if (relayerCreds && fromAddress) {
      throw new Error(
        `Configured RELAYER_API_KEY_ADDRESS ${relayerCreds.address} does not match transaction from ${fromAddress}. Configure Builder API credentials for app-managed deposit wallet setup, or use a relayer key owned by the connected wallet.`,
      );
    }

    throw new Error("Polymarket relayer credentials are not configured. Set RELAYER_API_KEY and RELAYER_API_KEY_ADDRESS, or configure Builder API credentials.");
  }

  const builderConfig = new BuilderConfig({
    localBuilderCreds: {
      key: builderCreds.key,
      secret: builderCreds.secret,
      passphrase: builderCreds.passphrase,
    },
  });
  const headers = await builderConfig.generateBuilderHeaders(method, path, body);

  if (!headers) {
    throw new Error("Unable to generate Polymarket relayer headers.");
  }

  return {
    "Content-Type": "application/json",
    ...headers,
  } satisfies Record<string, string>;
}

function getRelayerApiKeyCredentials() {
  const key = getRequiredEnv("RELAYER_API_KEY") ?? getRequiredEnv("POLYMARKET_RELAYER_API_KEY");
  const address = getRequiredEnv("RELAYER_API_KEY_ADDRESS") ?? getRequiredEnv("POLYMARKET_RELAYER_API_KEY_ADDRESS");

  if (!key || !address) {
    return undefined;
  }

  return {
    key,
    address,
  };
}

function getBuilderApiKeyCredentials() {
  const key = getRequiredEnv("POLYMARKET_BUILDER_API_KEY") ?? getRequiredEnv("BUILDER_API_KEY");
  const secret = getRequiredEnv("POLYMARKET_BUILDER_SECRET") ?? getRequiredEnv("BUILDER_SECRET");
  const passphrase =
    getRequiredEnv("POLYMARKET_BUILDER_PASSPHRASE") ??
    getRequiredEnv("POLYMARKET_BUILDER_PASS_PHRASE") ??
    getRequiredEnv("BUILDER_PASSPHRASE") ??
    getRequiredEnv("BUILDER_PASS_PHRASE");

  if (!key || !secret || !passphrase) {
    return undefined;
  }

  return {
    key,
    secret,
    passphrase,
  };
}

function parseSubmitFromAddress(body: string) {
  try {
    const payload = JSON.parse(body) as { from?: unknown };

    return typeof payload.from === "string" && /^0x[a-fA-F0-9]{40}$/.test(payload.from) ? payload.from : undefined;
  } catch {
    return undefined;
  }
}

function isSameAddress(left: string | undefined, right: string | undefined) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

function getRelayerUrl() {
  return (process.env.POLYMARKET_RELAYER_URL ?? process.env.RELAYER_URL ?? DEFAULT_RELAYER_URL).trim().replace(/\/$/, "");
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  return value ? value : undefined;
}

async function readResponseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string; errorMsg?: string; message?: string };

    return payload.error ?? payload.errorMsg ?? payload.message ?? `${response.status} ${response.statusText}`;
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}
