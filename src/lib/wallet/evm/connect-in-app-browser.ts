"use client";

import type { Connector } from "wagmi";
import { connect, getAccount } from "wagmi/actions";

import {
  getInAppBrowserWalletKind,
  isInWalletInAppBrowser,
  type InAppBrowserWalletKind,
} from "@/context/rainbowkit/utils";
import { wagmiConfig, type WagmiChainId } from "@/context/rainbowkit/wagmi-config";
import { TRADING_CHAIN_ID } from "@/lib/trading/wallet-trading-chain";
import { ensureEvmChain } from "@/lib/wallet/evm/evm-chain";
import { ensureMaticWallet } from "@/lib/wallet/tokenpocket/ensure-matic-wallet";

const CONNECTOR_ID_HINTS: Record<InAppBrowserWalletKind, string[]> = {
  tokenpocket: ["tokenpocket"],
  okx: ["okx", "okex"],
};

function connectorMatchesHints(connector: Connector, hints: string[]) {
  const connectorId = connector.id.toLowerCase();

  return hints.some((hint) => connectorId.includes(hint));
}

function resolveInAppConnector(kind: InAppBrowserWalletKind): Connector | undefined {
  const hints = CONNECTOR_ID_HINTS[kind];
  const matched = wagmiConfig.connectors.find((connector) =>
    connectorMatchesHints(connector, hints),
  );

  if (matched) {
    return matched;
  }

  return wagmiConfig.connectors.find((connector) =>
    connector.id.toLowerCase().includes("injected"),
  );
}

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

export async function connectInAppBrowserWallet(): Promise<{ address: string }> {
  if (!isInWalletInAppBrowser()) {
    throw new Error("Not in a supported in-app browser.");
  }

  const kind = getInAppBrowserWalletKind();

  if (!kind) {
    throw new Error("Not in a supported in-app browser.");
  }

  if (kind === "tokenpocket") {
    const maticResult = await ensureMaticWallet();

    if (maticResult.reloadPending) {
      throw new Error(
        "Switching to the Polygon wallet in TokenPocket. Tap Connect wallet again after the page reloads.",
      );
    }
  }

  const connector = resolveInAppConnector(kind);

  if (!connector) {
    throw new Error("No compatible wallet connector found in this browser.");
  }

  const existing = getAccount(wagmiConfig);

  if (
    existing.isConnected &&
    existing.address &&
    existing.connector?.id === connector.id
  ) {
    await ensureEvmChain(existing.address, TRADING_CHAIN_ID);
    return { address: existing.address };
  }

  try {
    const result = await connect(wagmiConfig, {
      connector,
      chainId: TRADING_CHAIN_ID as WagmiChainId,
    });

    const address = result.accounts[0];

    if (!address) {
      throw new Error("Wallet connection failed.");
    }

    await ensureEvmChain(address, TRADING_CHAIN_ID);

    return { address };
  } catch (error) {
    throw mapConnectError(error);
  }
}
