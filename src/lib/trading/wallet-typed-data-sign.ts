"use client";

import { recoverTypedDataAddress } from "viem";
import type { Hex } from "viem";

import { getStoredTradingWalletProvider } from "@/components/trading/trading-wallet-session";
import { getEthereumProvidersForWallet, getProviderLabel, type EthereumProvider } from "@/components/trading/wallet-provider";

export async function signTypedData(walletAddress: string, typedData: unknown): Promise<string> {
  const providers = await getEthereumProvidersForWallet(walletAddress, getStoredTradingWalletProvider(walletAddress));
  const mismatches: string[] = [];
  let lastError: string | undefined;

  for (const provider of providers) {
    try {
      const activeWalletAddress = await requestWalletAccountAccess(provider, walletAddress);

      if (!activeWalletAddress || !isSameAddress(activeWalletAddress, walletAddress)) {
        lastError = activeWalletAddress
          ? `${getProviderLabel(provider)} active account is ${activeWalletAddress}, not ${walletAddress}.`
          : `${getProviderLabel(provider)} did not return an active account.`;
        continue;
      }

      const signature = await provider.request({
        method: "eth_signTypedData_v4",
        params: [activeWalletAddress, JSON.stringify(typedData)],
      });

      if (typeof signature !== "string" || !/^0x[a-fA-F0-9]+$/.test(signature)) {
        lastError = "Wallet did not return a valid signature.";
        continue;
      }

      const recoverableTypedData = toRecoverableTypedData(typedData);

      // MetaMask eth_signTypedData_v4 can hash TypedDataSign differently than viem recovery
      // when the payload is sent over JSON. The active account was already verified above.
      if (recoverableTypedData.primaryType === "TypedDataSign") {
        return signature;
      }

      const recoveredAddress = await recoverTypedDataAddress({
        ...recoverableTypedData,
        signature: signature as Hex,
      } as Parameters<typeof recoverTypedDataAddress>[0]);

      if (isSameAddress(recoveredAddress, walletAddress)) {
        return signature;
      }

      mismatches.push(`${recoveredAddress} from ${getProviderLabel(provider)}`);
    } catch (error) {
      lastError = getErrorMessage(error);
    }
  }

  const mismatchDetail =
    mismatches.length > 0
      ? ` Recovered signer(s): ${[...new Set(mismatches.map((address) => address.toLowerCase()))].join(", ")}.`
      : lastError
        ? ` Last wallet error: ${lastError}.`
        : "";

  throw new Error(
    `Unable to sign with connected wallet ${walletAddress}.${mismatchDetail} Disable conflicting wallet extensions, switch the active account to ${walletAddress}, then reconnect the intended wallet.`,
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const value = error as { message?: unknown; code?: unknown };
    const message = typeof value.message === "string" ? value.message : undefined;
    const code = typeof value.code === "string" || typeof value.code === "number" ? String(value.code) : undefined;

    if (message && code) {
      return `${message} (${code})`;
    }

    if (message) {
      return message;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown wallet error.";
    }
  }

  return String(error);
}

async function requestWalletAccountAccess(provider: EthereumProvider, walletAddress: string) {
  if (provider.isMetaMask) {
    await provider
      .request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      })
      .catch(() => undefined);
  }

  const accounts = await provider
    .request({
      method: "eth_requestAccounts",
    })
    .catch(() => undefined);

  if (!Array.isArray(accounts)) {
    return undefined;
  }

  const accountList = accounts.filter((account): account is string => typeof account === "string");
  const matchingAccount = accountList.find((account) => isSameAddress(account, walletAddress));

  return matchingAccount ?? accountList[0];
}

function toRecoverableTypedData(typedData: unknown) {
  if (!typedData || typeof typedData !== "object") {
    throw new Error("Typed data payload is invalid.");
  }

  const payload = typedData as {
    domain?: unknown;
    types?: unknown;
    primaryType?: unknown;
    message?: unknown;
  };

  if (
    !payload.domain ||
    typeof payload.domain !== "object" ||
    !payload.types ||
    typeof payload.types !== "object" ||
    typeof payload.primaryType !== "string" ||
    !payload.message ||
    typeof payload.message !== "object"
  ) {
    throw new Error("Typed data payload is incomplete.");
  }

  return {
    domain: payload.domain,
    types: payload.types,
    primaryType: payload.primaryType,
    message: payload.message,
  };
}

function isSameAddress(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}
