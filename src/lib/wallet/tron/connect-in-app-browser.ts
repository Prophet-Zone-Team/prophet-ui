"use client";

import {
  getInAppBrowserWalletKind,
  isInWalletInAppBrowser,
  type InAppBrowserWalletKind,
} from "@/context/rainbowkit/utils";
import { ensureTronWallet } from "@/lib/wallet/tokenpocket/ensure-matic-wallet";
import { throwTpFundingSwitchPending } from "@/lib/wallet/tokenpocket/ensure-tp-wallet";
import { TP_BLOCKCHAIN_TRON } from "@/lib/wallet/tokenpocket/constants";
import { probeTokenPocketTronReady } from "@/lib/wallet/tokenpocket/tp-provider-probe";

const TRON_WALLET_READY_FOUND = "Found";

export type TronFundingWalletAdapter = {
  name: string;
  readyState: string;
  address: string | null;
  connect: () => Promise<void>;
};

const IN_APP_TRON_ADAPTER_NAMES: Record<InAppBrowserWalletKind, string> = {
  tokenpocket: "TokenPocket",
  okx: "OKX Wallet",
  metamask: "MetaMask",
  binance: "Binance Wallet",
};

function isUserRejectedRequest(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    Number((error as { code?: unknown }).code) === 4001
  );
}

function mapConnectError(error: unknown): Error {
  if (isUserRejectedRequest(error)) {
    return new Error("Wallet connection was rejected.");
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Wallet connection failed.");
}

export function resolveInAppTronAdapter(
  adapters: TronFundingWalletAdapter[],
  kind: InAppBrowserWalletKind,
): TronFundingWalletAdapter | undefined {
  const targetName = IN_APP_TRON_ADAPTER_NAMES[kind];

  console.log("resolveInAppTronAdapter targetName: %o", targetName);

  return adapters.find(
    (adapter) =>
      adapter.name === targetName && adapter.readyState === TRON_WALLET_READY_FOUND,
  ) ?? adapters.find(
    (adapter) =>
      adapter.readyState === TRON_WALLET_READY_FOUND,
  );
}

async function connectTronAdapter<T extends TronFundingWalletAdapter>(
  adapter: T,
): Promise<{ address: string; adapter: T }> {
  try {
    await adapter.connect();
  } catch (error) {
    throw mapConnectError(error);
  }

  const address = adapter.address;

  if (!address) {
    throw new Error("Wallet connection failed.");
  }

  return { address, adapter: adapter as T };
}

export async function connectInAppBrowserTronWallet<T extends TronFundingWalletAdapter>(
  adapters: T[],
): Promise<{ address: string; adapter: T }> {
  if (!isInWalletInAppBrowser()) {
    throw new Error("Not in a supported in-app browser.");
  }

  const kind = getInAppBrowserWalletKind();

  if (!kind) {
    throw new Error("Not in a supported in-app browser.");
  }

  console.log("connectInAppBrowserTronWallet adapters: %o", adapters);
  console.log("connectInAppBrowserTronWallet kind: %o", kind);

  const adapter = resolveInAppTronAdapter(adapters, kind);

  if (!adapter) {
    throw new Error("No compatible Tron wallet provider found in this browser.");
  }

  if (kind === "tokenpocket" && probeTokenPocketTronReady()) {
    try {
      return await connectTronAdapter(adapter as T);
    } catch (error) {
      if (isUserRejectedRequest(error)) {
        throw mapConnectError(error);
      }
      // Fall through to tp-js-sdk wallet family switch.
    }
  }

  if (kind === "tokenpocket") {
    const tronResult = await ensureTronWallet();

    if (tronResult.reloadPending) {
      throwTpFundingSwitchPending(TP_BLOCKCHAIN_TRON);
    }
  }

  return connectTronAdapter(adapter as T);
}
