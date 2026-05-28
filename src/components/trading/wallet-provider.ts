"use client";

import { createWalletClient, custom, type Address, type Chain, type WalletClient } from "viem";

import { disconnect, getAccount } from "wagmi/actions";
import type { Connector } from "wagmi";

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
  const connector = resolveLiveConnector(account.connector);

  if (!connector) {
    throw new Error("Unable to access the connected wallet connector. Reconnect and try again.");
  }

  const provider = await connector.getProvider();
  const chain = resolveWalletChain(chainId);

  return createWalletClient({
    account: walletAddress as Address,
    chain,
    transport: custom(provider as Parameters<typeof custom>[0]),
  });
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

function resolveWalletChain(chainId?: number): Chain {
  if (chainId) {
    const chain = wagmiConfig.chains.find((candidate) => candidate.id === chainId);

    if (chain) {
      return chain;
    }
  }

  const accountChainId = getAccount(wagmiConfig).chainId;
  const accountChain = wagmiConfig.chains.find((candidate) => candidate.id === accountChainId);

  return accountChain ?? wagmiConfig.chains[0];
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
