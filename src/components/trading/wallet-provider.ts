"use client";

import type { WalletClient } from "viem";

import {
  disconnectEvmWallet,
  getEvmWalletClient,
  requestEvmWalletRpc,
  signEvmMessage,
  type EvmWalletRpcRequest,
} from "@/lib/wallet/evm/evm-adapter";
import { getActiveEvmAccount } from "@/lib/wallet/evm/signer-source";

interface WalletClientOptions {
  chainId?: number;
}

export type WalletRpcRequest = EvmWalletRpcRequest;

export type WalletProviderKind = "okx" | "metamask" | "privy" | "injected";

export function connectorIdToProviderKind(connectorId?: string): WalletProviderKind {
  if (!connectorId) {
    return "injected";
  }

  const legacyKinds: WalletProviderKind[] = ["okx", "metamask", "privy", "injected"];

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

  if (lower.includes("privy")) {
    return "privy";
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

  if (kind === "privy") {
    return "Privy wallet";
  }

  return "connected wallet";
}

export async function getWalletClientForAddress(
  walletAddress: string,
  options?: WalletClientOptions,
): Promise<WalletClient> {
  return getEvmWalletClient(walletAddress, options);
}

export async function requestWalletRpc(
  walletAddress: string,
  request: WalletRpcRequest,
  options?: WalletClientOptions,
): Promise<unknown> {
  return requestEvmWalletRpc(walletAddress, request, options);
}

export async function getAuthorizedWalletAccounts(): Promise<string[]> {
  const account = getActiveEvmAccount();

  if (!account.connected || !account.address) {
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

export async function signMessageWithWallet(
  walletAddress: string,
  message: string,
): Promise<`0x${string}`> {
  return signEvmMessage(walletAddress, message);
}

export async function disconnectWagmiWallet() {
  await disconnectEvmWallet();
}
