"use client";

import { recoverTypedDataAddress } from "viem";
import type { Hex } from "viem";

import { getProviderLabelFromConnectorId } from "@/components/trading/wallet-provider";
import { getStoredWalletConnectorId } from "@/components/trading/trading-wallet-session";
import { resolveWalletErrorMessage, WALLET_USER_REJECTION_MESSAGE } from "@/lib/trading/wallet-error-message";
import {
  ensureTradingChain,
  TRADING_CHAIN_ID,
} from "@/lib/trading/wallet-trading-chain";
import {
  signEvmTypedDataPayload,
  type RecoverableTypedDataPayload,
} from "@/lib/wallet/evm/evm-adapter";

export async function signTypedData(walletAddress: string, typedData: unknown): Promise<string> {
  const connectorId = getStoredWalletConnectorId(walletAddress);
  const walletLabel = getProviderLabelFromConnectorId(connectorId);

  try {
    const recoverableTypedData = toRecoverableTypedData(typedData);

    await ensureTradingChain(walletAddress);

    const signature = await signEvmTypedDataPayload(
      walletAddress,
      recoverableTypedData,
      { chainId: TRADING_CHAIN_ID },
    );

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
    const errorMessage = resolveWalletErrorMessage(error);
    if (errorMessage === WALLET_USER_REJECTION_MESSAGE) {
      throw new Error(errorMessage);
    }
    throw new Error(
      `Unable to sign with connected wallet ${walletAddress}. ${errorMessage} Switch the active account to ${walletAddress}, then try again.`,
    );
  }
}

function toRecoverableTypedData(typedData: unknown): RecoverableTypedDataPayload {
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
