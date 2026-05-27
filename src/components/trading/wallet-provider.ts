"use client";

import type { Address, WalletClient } from "viem";

import { disconnect, getAccount, getWalletClient } from "wagmi/actions";

import { wagmiConfig } from "@/context/rainbowkit/wagmi-config";

interface WalletClientOptions {
  chainId?: number;
}

export interface WalletRpcRequest {
  method: string;
  params?: unknown[] | Record<string, unknown>;
}

export type WalletProviderKind = "okx" | "metamask" | "injected";

export function connectorIdToProviderKind(connectorId?: string): WalletProviderKind {
  if (!connectorId) {
    return "injected";
  }

  const legacyKinds: WalletProviderKind[] = ["okx", "metamask", "injected"];

  if (legacyKinds.includes(connectorId as WalletProviderKind)) {
    return connectorId as WalletProviderKind;
  }

  const lower = connectorId.toLowerCase();

  if (lower.includes("okx") || lower.includes("okex")) {
    return "okx";
  }

  if (lower.includes("metamask") || lower.includes("io.metamask")) {
    return "metamask";
  }

  return "injected";
}

export function getProviderKindFromConnectorId(connectorId?: string): WalletProviderKind {
  return connectorIdToProviderKind(connectorId);
}

export function getProviderLabelFromConnectorId(connectorId?: string) {
  const kind = connectorIdToProviderKind(connectorId);

  if (kind === "okx") {
    return "OKX Wallet";
  }

  if (kind === "metamask") {
    return "MetaMask";
  }

  return "connected wallet";
}

export async function getWalletClientForAddress(
  walletAddress: string,
  options?: WalletClientOptions,
): Promise<WalletClient> {
  const account = getAccount(wagmiConfig);

  if (!account.isConnected || !account.address) {
    throw new Error("No wallet connected. Connect your wallet to continue.");
  }

  if (!isSameAddress(account.address, walletAddress)) {
    throw new Error(
      `The connected trading session is ${normalizeAddress(walletAddress)}, but the active wallet is ${account.address}. Switch your wallet account or reconnect.`,
    );
  }

  const chainId = options?.chainId ?? account.chainId;
  const client = await getWalletClient(wagmiConfig, { chainId });

  if (!client) {
    throw new Error("Unable to access the connected wallet. Reconnect and try again.");
  }

  return client;
}

export async function requestWalletRpc(
  walletAddress: string,
  request: WalletRpcRequest,
  options?: WalletClientOptions,
): Promise<unknown> {
  const client = await getWalletClientForAddress(walletAddress, options);

  return client.request({
    method: request.method as never,
    params: request.params as never,
  });
}

export async function getAuthorizedWalletAccounts(): Promise<string[]> {
  const account = getAccount(wagmiConfig);

  if (!account.isConnected || !account.address) {
    return [];
  }

  return [account.address.toLowerCase()];
}

export function isWalletAddressAuthorized(
  walletAddress: string,
  authorizedAccounts: string[],
): boolean {
  const normalized = walletAddress.toLowerCase();
  return authorizedAccounts.some((account) => account === normalized);
}

export function getPrimaryAuthorizedWalletAccount(
  authorizedAccounts: string[],
): string | undefined {
  return authorizedAccounts[0];
}

function normalizeAddress(address: string) {
  const value = address.trim();

  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error("Invalid wallet address.");
  }

  return value;
}

function isSameAddress(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}

export async function signMessageWithWallet(
  walletAddress: string,
  message: string,
): Promise<`0x${string}`> {
  const client = await getWalletClientForAddress(walletAddress);

  return client.signMessage({
    account: walletAddress as Address,
    message,
  });
}

export async function disconnectWagmiWallet() {
  await disconnect(wagmiConfig);
}
