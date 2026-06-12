"use client";

import { disconnect, getAccount } from "wagmi/actions";
import type { Connector } from "wagmi";

import { wagmiConfig } from "@/context/rainbowkit/wagmi-config";
import { AuthLoginMethod } from "@/store/auth-store";

const EXTERNAL_CONNECTOR_ID_HINTS = [
  "okx",
  "okex",
  "metamask",
  "injected",
  "walletconnect",
  "coinbase",
  "rainbow",
  "phantom",
  "brave",
];

export function isExternalWagmiConnector(connectorId?: string): boolean {
  const id = connectorId?.toLowerCase() ?? "";

  if (!id) {
    return false;
  }

  if (id.includes("privy") && !EXTERNAL_CONNECTOR_ID_HINTS.some((hint) => id.includes(hint))) {
    return false;
  }

  return EXTERNAL_CONNECTOR_ID_HINTS.some((hint) => id.includes(hint));
}

async function disconnectConnectorDeep(connector: Connector): Promise<void> {
  try {
    if (typeof connector.disconnect === "function") {
      await connector.disconnect();
    }
  } catch {
    // ignore connector-specific disconnect errors
  }

  try {
    if (typeof connector.getProvider !== "function") {
      return;
    }

    const provider = (await connector.getProvider()) as {
      request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    } | null;

    if (!provider?.request) {
      return;
    }

    await provider
      .request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      })
      .catch(() => undefined);
  } catch {
    // ignore provider revoke errors (not supported by every wallet)
  }
}

/** Drops wagmi + provider state for extension / injected wallets (OKX, MetaMask, etc.). */
export async function releaseExternalWalletConnection(currentLoginMethod?: AuthLoginMethod): Promise<void> {
  const account = getAccount(wagmiConfig);

  if (!account.isConnected || !account.connector) {
    return;
  }

  if (currentLoginMethod === "google" || currentLoginMethod === "email") {
    if (!isExternalWagmiConnector(account.connector.id)) {
      return;
    }
  }

  await disconnectConnectorDeep(account.connector);
  await disconnect(wagmiConfig);
}
