"use client";

import { recoverTypedDataAddress } from "viem";
import type { Address, Hex } from "viem";
import { getAccount, signTypedData as wagmiSignTypedData } from "wagmi/actions";
import type { Connector } from "wagmi";

import { getProviderLabelFromConnectorId } from "@/components/trading/wallet-provider";
import { wagmiConfig } from "@/context/rainbowkit/wagmi-config";
import { getStoredWalletConnectorId } from "@/components/trading/trading-wallet-session";
import { prepareWalletSigning } from "@/lib/trading/prepare-wallet-signing";
import { resolveWalletErrorMessage } from "@/lib/trading/wallet-error-message";
import { TRADING_CHAIN_ID } from "@/lib/trading/wallet-trading-chain";

export async function signTypedData(walletAddress: string, typedData: unknown): Promise<string> {
  const connectorId = getStoredWalletConnectorId(walletAddress);
  const walletLabel = getProviderLabelFromConnectorId(connectorId);

  try {
    const recoverableTypedData = toRecoverableTypedData(typedData);
    const account = getAccount(wagmiConfig);

    if (!account.isConnected || !account.address) {
      throw new Error("No wallet connected. Connect your wallet to continue.");
    }

    if (!isSameAddress(account.address, walletAddress)) {
      throw new Error(
        `The connected trading session is ${walletAddress}, but the active wallet is ${account.address}. Switch your wallet account or reconnect.`,
      );
    }

    const connector = resolveLiveConnector(account.connector);

    if (!connector) {
      throw new Error("Unable to access the connected wallet connector. Reconnect and try again.");
    }

    await prepareWalletSigning({ chainId: TRADING_CHAIN_ID });

    const signature = await wagmiSignTypedData(wagmiConfig, {
      account: walletAddress as Address,
      connector,
      domain: recoverableTypedData.domain as Parameters<typeof wagmiSignTypedData>[1]["domain"],
      types: recoverableTypedData.types as Parameters<typeof wagmiSignTypedData>[1]["types"],
      primaryType: recoverableTypedData.primaryType,
      message: recoverableTypedData.message as Parameters<typeof wagmiSignTypedData>[1]["message"],
    });

    if (typeof signature !== "string" || !/^0x[a-fA-F0-9]+$/.test(signature)) {
      throw new Error("Wallet did not return a valid signature.");
    }

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

    throw new Error(
      `Signature from ${walletLabel} did not match wallet ${walletAddress}. Recovered ${recoveredAddress}.`,
    );
  } catch (error) {
    throw new Error(
      `Unable to sign with connected wallet ${walletAddress}. ${resolveWalletErrorMessage(error)} Switch the active account to ${walletAddress}, then try again.`,
    );
  }
}

function resolveLiveConnector(connector: Connector | undefined): Connector | undefined {
  if (!connector) {
    return undefined;
  }

  if (typeof connector.getProvider === "function") {
    return connector;
  }

  return wagmiConfig.connectors.find(
    (candidate) => candidate.uid === connector.uid || candidate.id === connector.id,
  );
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
