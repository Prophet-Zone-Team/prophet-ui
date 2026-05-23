"use client";

import {
  disconnectTradingSession,
  loadTradingSession
} from "@/components/trading/trading-wallet-session";
import { deriveTradingCredentials } from "@/lib/trading/clob-credentials-client";
import {
  deployDepositWallet,
  fetchDepositWalletStatus,
  pollDepositWalletUntilDeployed,
} from "@/lib/trading/deposit-wallet-client";
import { submitDepositWalletApproval } from "@/lib/trading/deposit-wallet-approval";
import { fetchJson } from "@/lib/team/client-fetch";
import { isSetupStepComplete } from "@/lib/trading/trading-setup";
import { ensureTradingChain } from "@/lib/trading/wallet-trading-chain";
import type { DepositWalletCheckResponse, TradingUserSession, UserTradingReadiness } from "@/types/market";
import {
  getEthereumProvider,
  getEthereumProviderForWallet,
  getProviderKind,
  type EthereumProvider
} from "@/components/trading/wallet-provider";
import { getStoredTradingWalletProvider } from "@/components/trading/trading-wallet-session";

const DEFAULT_SIGNATURE_TYPE = 3;

interface TradingSessionChallenge {
  nonce: string;
  walletAddress: string;
  message: string;
  token: string;
}

export type TradingLoginStep =
  | "requesting_wallet"
  | "checking_wallet_deployment"
  | "wallet_already_deployed"
  | "deploying_wallet"
  | "awaiting_session_signature"
  | "creating_session"
  | "checking_clob_credentials"
  | "clob_already_derived"
  | "checking_trading_chain"
  | "switching_trading_chain"
  | "awaiting_clob_signature"
  | "deriving_credentials"
  | "checking_token_approval"
  | "tokens_already_authorized"
  | "awaiting_token_approval_signature"
  | "submitting_token_approval"
  | "verifying_readiness";

export async function completeTradingLogin(options?: {
  onStep?: (step: TradingLoginStep) => void;
  resume?: boolean;
}): Promise<{ session: TradingUserSession; readiness: UserTradingReadiness }> {
  let session: TradingUserSession | undefined;

  if (options?.resume) {
    session = await loadTradingSession();
  }

  try {
    if (!session) {
      const walletAddress = await connectWallet({
        onStep: options?.onStep,
      });
      await ensureDepositWalletDeployed(walletAddress, {
        onStep: options?.onStep,
      });
      session = await createTradingSession(walletAddress, {
        onStep: options?.onStep,
      });
    }
  } catch (error) {
    await disconnectTradingSession().catch(() => undefined);
    throw error;
  }

  options?.onStep?.("verifying_readiness");
  const readiness = await fetchJson<UserTradingReadiness>("/api/trading/readiness");

  return { session: session!, readiness };
}

export async function ensureDepositWalletDeployed(
  walletAddress: string,
  options?: {
    onStep?: (step: TradingLoginStep) => void;
  },
): Promise<DepositWalletCheckResponse> {
  options?.onStep?.("checking_wallet_deployment");

  const initialStatus = await fetchDepositWalletStatus(walletAddress);

  if (initialStatus.deployed) {
    options?.onStep?.("wallet_already_deployed");
    return initialStatus;
  }

  options?.onStep?.("deploying_wallet");

  const deployResult = await deployDepositWallet(walletAddress);

  if (deployResult.status === "deployed") {
    options?.onStep?.("wallet_already_deployed");
    return {
      walletAddress: deployResult.walletAddress,
      deployed: true,
      status: "deployed",
      checkedAt: deployResult.checkedAt,
    };
  }

  if (deployResult.status === "relayer_unconfigured" || deployResult.status === "error") {
    throw new Error(deployResult.error ?? "Unable to deploy Polymarket deposit wallet.");
  }

  if (deployResult.status !== "deploying") {
    throw new Error(
      deployResult.error ?? `Unexpected deposit wallet status: ${deployResult.status}.`,
    );
  }

  return pollDepositWalletUntilDeployed(walletAddress);
}

export async function signClobCredentials(
  session: TradingUserSession,
  options?: {
    onStep?: (step: TradingLoginStep) => void;
  },
) {
  await ensureTradingChain(session.walletAddress, {
    onChecking: () => options?.onStep?.("checking_trading_chain"),
    onSwitching: () => options?.onStep?.("switching_trading_chain"),
  });

  await deriveTradingCredentials(session, {
    onChecking: () => options?.onStep?.("checking_clob_credentials"),
    onAwaitingSignature: () => options?.onStep?.("awaiting_clob_signature"),
    onDeriving: () => options?.onStep?.("deriving_credentials"),
  });
}

export async function ensureClobCredentials(
  session: TradingUserSession,
  options?: {
    onStep?: (step: TradingLoginStep) => void;
  },
): Promise<UserTradingReadiness> {
  options?.onStep?.("checking_clob_credentials");

  const initialReadiness = await fetchTradingReadiness();

  if (isSetupStepComplete(initialReadiness, "clob")) {
    options?.onStep?.("clob_already_derived");
    return initialReadiness;
  }

  await signClobCredentials(session, options);
  return fetchTradingReadiness();
}

export async function signTokenApprovals(
  session: TradingUserSession,
  options?: {
    onStep?: (step: TradingLoginStep) => void;
    onStatus?: (message: string) => void;
  },
) {
  options?.onStep?.("awaiting_token_approval_signature");
  await submitDepositWalletApproval(session, {
    onStatus: (message) => {
      options?.onStatus?.(message);
      options?.onStep?.("submitting_token_approval");
    },
  });
}

export async function ensureTokenApprovals(
  session: TradingUserSession,
  options?: {
    onStep?: (step: TradingLoginStep) => void;
    onStatus?: (message: string) => void;
  },
): Promise<UserTradingReadiness> {
  options?.onStep?.("checking_token_approval");

  const initialReadiness = await fetchTradingReadiness();

  if (isSetupStepComplete(initialReadiness, "tokens")) {
    options?.onStep?.("tokens_already_authorized");
    return initialReadiness;
  }

  await signTokenApprovals(session, options);
  return fetchTradingReadiness();
}

async function fetchTradingReadiness() {
  return fetchJson<UserTradingReadiness>("/api/trading/readiness");
}

export async function connectWallet(options?: {
  onStep?: (step: TradingLoginStep) => void;
}): Promise<string> {
  options?.onStep?.("requesting_wallet");

  const provider = getEthereumProvider();

  if (!provider) {
    throw new Error(
      "No injected wallet provider found. Install or unlock an EVM wallet, then try again."
    );
  }

  const accounts = await provider.request({
    method: "eth_requestAccounts"
  });
  const walletAddress =
    Array.isArray(accounts) && typeof accounts[0] === "string"
      ? accounts[0]
      : undefined;

  if (!walletAddress) {
    throw new Error("Wallet did not return an account.");
  }

  return walletAddress;
}

export async function createTradingSession(
  walletAddress: string,
  options?: {
    onStep?: (step: TradingLoginStep) => void;
  },
): Promise<TradingUserSession> {
  const challengeResponse = await fetch("/api/trading/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      mode: "challenge",
      walletAddress
    })
  });
  const challengePayload = (await challengeResponse.json()) as {
    challenge?: TradingSessionChallenge;
    error?: string;
  };

  if (!challengeResponse.ok || !challengePayload.challenge) {
    throw new Error(
      challengePayload.error ?? "Unable to create a trading session challenge."
    );
  }

  options?.onStep?.("awaiting_session_signature");

  const signingProvider = await getEthereumProviderForWallet(
    walletAddress,
    getStoredTradingWalletProvider(walletAddress)
  );
  const signature = await signTradingSessionMessage({
    provider: signingProvider,
    walletAddress,
    message: challengePayload.challenge.message
  });

  options?.onStep?.("creating_session");

  const response = await fetch("/api/trading/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      mode: "create",
      walletAddress,
      token: challengePayload.challenge.token,
      signature,
      signatureType: DEFAULT_SIGNATURE_TYPE
    })
  });
  const payload = (await response.json()) as {
    session?: TradingUserSession;
    error?: string;
  };

  if (!response.ok || !payload.session) {
    throw new Error(payload.error ?? "Unable to create a trading session.");
  }

  writeStoredTradingWalletProvider(
    payload.session.walletAddress,
    getProviderKind(signingProvider)
  );

  return payload.session;
}

async function signTradingSessionMessage({
  provider,
  walletAddress,
  message
}: {
  provider: EthereumProvider;
  walletAddress: string;
  message: string;
}) {
  try {
    const signature = await provider.request({
      method: "personal_sign",
      params: [message, walletAddress]
    });

    if (typeof signature === "string") {
      return signature;
    }
  } catch (error) {
    if (isUserRejectedRequest(error)) {
      throw error;
    }

    const fallbackSignature = await provider.request({
      method: "personal_sign",
      params: [walletAddress, message]
    });

    if (typeof fallbackSignature === "string") {
      return fallbackSignature;
    }

    throw error;
  }

  throw new Error("Wallet did not return a trading session signature.");
}

function isUserRejectedRequest(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    Number((error as { code?: unknown }).code) === 4001
  );
}

function writeStoredTradingWalletProvider(
  walletAddress: string,
  providerKind: ReturnType<typeof getProviderKind>
) {
  if (typeof window === "undefined") {
    return;
  }

  const PROVIDER_STORAGE_PREFIX = "wc_trading_wallet_provider";
  window.localStorage.setItem(
    `${PROVIDER_STORAGE_PREFIX}:${walletAddress.toLowerCase()}`,
    providerKind
  );
}
