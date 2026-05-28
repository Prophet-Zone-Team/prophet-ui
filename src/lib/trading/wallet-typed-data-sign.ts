"use client";

import { recoverTypedDataAddress } from "viem";
import type { Address, Hex } from "viem";

import {
  getWalletClientForAddress,
  getProviderLabelFromConnectorId,
} from "@/components/trading/wallet-provider";
import { getStoredWalletConnectorId } from "@/components/trading/trading-wallet-session";
import { resolveWalletErrorMessage } from "@/lib/trading/wallet-error-message";

export async function signTypedData(walletAddress: string, typedData: unknown): Promise<string> {
  const connectorId = getStoredWalletConnectorId(walletAddress);
  const walletLabel = getProviderLabelFromConnectorId(connectorId);

  try {
    const client = await getWalletClientForAddress(walletAddress);
    const recoverableTypedData = toRecoverableTypedData(typedData);

    const signature = await client.signTypedData({
      account: walletAddress as Address,
      ...recoverableTypedData,
    } as Parameters<typeof client.signTypedData>[0]);

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
