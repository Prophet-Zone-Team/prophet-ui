"use client";

import {
  disconnectTradingSession,
  loadTradingSession,
  storeConnectedWalletConnector
} from "@/components/trading/trading-wallet-session";
import { getAccount } from "wagmi/actions";

import { getConnectGate } from "@/context/rainbowkit/connect-gate";
import { wagmiConfig } from "@/context/rainbowkit/wagmi-config";
import { signMessageWithWallet } from "@/components/trading/wallet-provider";
import { activatePrivyWallet } from "@/context/privy/privy-wallet-bridge";
import { getActiveEvmAccount } from "@/lib/wallet/evm/signer-source";
import { releaseExternalWalletConnection } from "@/lib/trading/wallet-disconnect";
import { AuthLoginMethod, useAuthStore } from "@/store/auth-store";
import { deriveTradingCredentials } from "@/lib/trading/clob-credentials-client";
import {
  deployDepositWallet,
  fetchDepositWalletStatus,
  pollDepositWalletUntilDeployed
} from "@/lib/trading/deposit-wallet-client";
import { submitDepositWalletApproval } from "@/lib/trading/deposit-wallet-approval";
import { mergeTradingReadiness } from "@/lib/trading/merge-trading-readiness";
import {
  fetchTradingBalancesWithOnchain,
  fetchTradingReadinessWithOnchain
} from "@/lib/trading/trading-balances-client";
import { isSetupStepComplete } from "@/lib/trading/trading-setup";
import { ensureTradingChain } from "@/lib/trading/wallet-trading-chain";
import type {
  DepositWalletCheckResponse,
  TradingUserSession,
  UserTradingReadiness
} from "@/types/market";
import { resolveWalletErrorMessage } from "@/lib/trading/wallet-error-message";

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

// export async function completeTradingLogin(options?: {
//   loginMethod?: AuthLoginMethod;
//   onStep?: (step: TradingLoginStep) => void;
//   resume?: boolean;
//   connectSignal?: AbortSignal;
// }): Promise<{ session: TradingUserSession; readiness: UserTradingReadiness }> {
//   let session: TradingUserSession | undefined;

//   if (options?.resume) {
//     session = await loadTradingSession();
//   }

//   try {
//     if (!session) {
//       const walletAddress = await connectWallet({
//         loginMethod: options?.loginMethod,
//         onStep: options?.onStep,
//         signal: options?.connectSignal,
//       });
//       await ensureDepositWalletDeployed(walletAddress, {
//         onStep: options?.onStep,
//       });
//       session = await createTradingSession(walletAddress, {
//         onStep: options?.onStep,
//       });
//     }
//   } catch (error) {
//     await disconnectTradingSession().catch(() => undefined);
//     throw error;
//   }

//   options?.onStep?.("verifying_readiness");
//   const readiness = await fetchTradingReadinessWithBalances();

//   return { session: session!, readiness };
// }

export async function ensureDepositWalletDeployed(
  walletAddress: string,
  options?: {
    onStep?: (step: TradingLoginStep) => void;
  }
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
      checkedAt: deployResult.checkedAt
    };
  }

  if (
    deployResult.status === "relayer_unconfigured" ||
    deployResult.status === "error"
  ) {
    throw new Error(
      deployResult.error ?? "Unable to deploy Polymarket deposit wallet."
    );
  }

  if (deployResult.status !== "deploying") {
    throw new Error(
      deployResult.error ??
        `Unexpected deposit wallet status: ${deployResult.status}.`
    );
  }

  return pollDepositWalletUntilDeployed(walletAddress);
}

export async function signClobCredentials(
  session: TradingUserSession,
  options?: {
    onStep?: (step: TradingLoginStep) => void;
  }
) {
  await ensureTradingChain(session.walletAddress, {
    onChecking: () => options?.onStep?.("checking_trading_chain"),
    onSwitching: () => options?.onStep?.("switching_trading_chain")
  });

  await deriveTradingCredentials(session, {
    onChecking: () => options?.onStep?.("checking_clob_credentials"),
    onAwaitingSignature: () => options?.onStep?.("awaiting_clob_signature"),
    onDeriving: () => options?.onStep?.("deriving_credentials")
  });
}

export async function ensureClobCredentials(
  session: TradingUserSession,
  options?: {
    onStep?: (step: TradingLoginStep) => void;
  }
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
  }
) {
  options?.onStep?.("awaiting_token_approval_signature");
  await submitDepositWalletApproval(session, {
    onStatus: (message) => {
      options?.onStatus?.(message);
      options?.onStep?.("submitting_token_approval");
    }
  });
}

export async function ensureTokenApprovals(
  session: TradingUserSession,
  options?: {
    onStep?: (step: TradingLoginStep) => void;
    onStatus?: (message: string) => void;
  }
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
  return fetchTradingReadinessWithOnchain();
}

export async function fetchTradingBalances() {
  const session = useAuthStore.getState().session;

  return fetchTradingBalancesWithOnchain(session);
}

export async function fetchTradingReadinessWithBalances() {
  const [setup, balances] = await Promise.all([
    fetchTradingReadiness(),
    fetchTradingBalances().catch(() => undefined)
  ]);

  return mergeTradingReadiness(setup, balances);
}

// export async function connectWallet(options?: {
//   loginMethod?: AuthLoginMethod;
//   onStep?: (step: TradingLoginStep) => void;
//   signal?: AbortSignal;
//   expectedAddress?: string;
// }): Promise<string> {
//   options?.onStep?.("requesting_wallet");

//   const loginMethod = options?.loginMethod ?? useAuthStore.getState().loginMethod;
//   const preferEmbedded = loginMethod === "email" || loginMethod === "google";

//   if (preferEmbedded) {
//     await releaseExternalWalletConnection(loginMethod);

//     const embeddedAddress = await activatePrivyWallet(options?.expectedAddress, {
//       preferEmbedded: true,
//     });

//     if (embeddedAddress) {
//       return embeddedAddress;
//     }
//   }

//   const account = getAccount(wagmiConfig);

//   if (account.isConnected && account.address && !preferEmbedded) {
//     if (
//       !options?.expectedAddress ||
//       account.address.toLowerCase() === options.expectedAddress.toLowerCase()
//     ) {
//       if (account.connector?.id) {
//         storeConnectedWalletConnector(account.address, account.connector.id);
//       }

//       return account.address;
//     }
//   }

//   try {
//     const walletAddress = await getConnectGate().openConnectAndWait({
//       expectedAddress: options?.expectedAddress,
//       signal: options?.signal,
//     });

//     const connected = getAccount(wagmiConfig);

//     if (connected.connector?.id) {
//       storeConnectedWalletConnector(walletAddress, connected.connector.id);
//     }

//     return walletAddress;
//   } catch (error) {
//     throw new Error(resolveWalletErrorMessage(error));
//   }
// }

export async function createTradingSession(
  walletAddress: string,
  options?: {
    onStep?: (step: TradingLoginStep) => void;
  }
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

  let signature: string;

  try {
    signature = await signMessageWithWallet(
      walletAddress,
      challengePayload.challenge.message
    );
  } catch (error) {
    throw new Error(resolveWalletErrorMessage(error));
  }

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

  const connected = getAccount(wagmiConfig);

  if (connected.connector?.id) {
    storeConnectedWalletConnector(
      payload.session.walletAddress,
      connected.connector.id
    );
  } else {
    // Privy embedded wallets are not registered as wagmi connectors.
    const activeAccount = getActiveEvmAccount();

    if (activeAccount.source === "privy") {
      storeConnectedWalletConnector(payload.session.walletAddress, "privy");
    }
  }

  return payload.session;
}
