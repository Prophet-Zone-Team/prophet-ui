"use client";

import { createWalletClient, custom } from "viem";
import type { Address, WalletClient } from "viem";
import {
  disconnect as wagmiDisconnect,
  getWalletClient as wagmiGetWalletClient,
  signMessage as wagmiSignMessage,
  signTypedData as wagmiSignTypedData,
} from "wagmi/actions";
import type { ConnectedWallet } from "@privy-io/react-auth";

import { getFundingEvmChain } from "@/config/funding/evm-chains";
import { wagmiConfig } from "@/context/rainbowkit/wagmi-config";
import { prepareWalletSigning } from "@/lib/trading/prepare-wallet-signing";
import { releaseExternalWalletConnection } from "@/lib/trading/wallet-disconnect";
import {
  parseCaip2ChainId,
  resolveEvmSignerSource,
} from "@/lib/wallet/evm/signer-source";

export interface EvmWalletClientOptions {
  chainId?: number;
}

export interface EvmWalletRpcRequest {
  method: string;
  params?: unknown[] | Record<string, unknown>;
}

export interface RecoverableTypedDataPayload {
  domain: object;
  types: object;
  primaryType: string;
  message: object;
}

async function getPrivyWalletClient(
  wallet: ConnectedWallet,
  chainId?: number,
): Promise<WalletClient> {
  const provider = await wallet.getEthereumProvider();
  const resolvedChainId = chainId ?? parseCaip2ChainId(wallet.chainId);
  const chain = resolvedChainId ? getFundingEvmChain(resolvedChainId) : undefined;

  return createWalletClient({
    account: wallet.address as Address,
    chain,
    transport: custom(provider),
  });
}

export async function getEvmWalletClient(
  walletAddress: string,
  options?: EvmWalletClientOptions,
): Promise<WalletClient> {
  const source = resolveEvmSignerSource(walletAddress);

  if (source.kind === "external") {
    return source.signer.getWalletClient(options?.chainId);
  }

  if (source.kind === "privy") {
    await prepareWalletSigning({
      chainId: options?.chainId,
      skipConnectorPrewarm: true,
    });

    return getPrivyWalletClient(source.wallet, options?.chainId);
  }

  const chainId = options?.chainId ?? source.chainId;

  await prepareWalletSigning({ chainId });

  const client = await wagmiGetWalletClient(wagmiConfig, {
    account: walletAddress as Address,
    chainId,
    connector: source.connector,
  });

  return client as WalletClient;
}

export async function requestEvmWalletRpc(
  walletAddress: string,
  request: EvmWalletRpcRequest,
  options?: EvmWalletClientOptions,
): Promise<unknown> {
  const client = await getEvmWalletClient(walletAddress, options);

  return client.request({
    method: request.method as never,
    params: request.params as never,
  });
}

export async function signEvmMessage(
  walletAddress: string,
  message: string,
): Promise<`0x${string}`> {
  const source = resolveEvmSignerSource(walletAddress);

  if (source.kind === "external") {
    return source.signer.signMessage(message);
  }

  if (source.kind === "privy") {
    await prepareWalletSigning({ skipConnectorPrewarm: true });

    const client = await getPrivyWalletClient(source.wallet);

    return client.signMessage({
      account: source.wallet.address as Address,
      message,
    });
  }

  await prepareWalletSigning();

  return wagmiSignMessage(wagmiConfig, {
    account: walletAddress as Address,
    message,
    connector: source.connector,
  });
}

/**
 * Raw EIP-712 signing across wagmi and Privy signers. Callers remain
 * responsible for chain checks and signature validation.
 */
export async function signEvmTypedDataPayload(
  walletAddress: string,
  payload: RecoverableTypedDataPayload,
  options?: EvmWalletClientOptions,
): Promise<string> {
  const source = resolveEvmSignerSource(walletAddress);

  if (source.kind === "external") {
    return source.signer.signTypedData(payload);
  }

  if (source.kind === "privy") {
    await prepareWalletSigning({
      chainId: options?.chainId,
      skipConnectorPrewarm: true,
    });

    const client = await getPrivyWalletClient(source.wallet, options?.chainId);

    return client.signTypedData({
      account: source.wallet.address as Address,
      domain: payload.domain as Parameters<WalletClient["signTypedData"]>[0]["domain"],
      types: payload.types as Parameters<WalletClient["signTypedData"]>[0]["types"],
      primaryType: payload.primaryType,
      message: payload.message as Record<string, unknown>,
    });
  }

  await prepareWalletSigning({ chainId: options?.chainId });

  return wagmiSignTypedData(wagmiConfig, {
    account: walletAddress as Address,
    connector: source.connector,
    domain: payload.domain as Parameters<typeof wagmiSignTypedData>[1]["domain"],
    types: payload.types as Parameters<typeof wagmiSignTypedData>[1]["types"],
    primaryType: payload.primaryType,
    message: payload.message as Parameters<typeof wagmiSignTypedData>[1]["message"],
  });
}

/**
 * Drops wagmi connector state. Privy embedded wallets have no wagmi
 * connection; their session is ended separately via privy.logout() in the
 * auth layer.
 */
export async function disconnectEvmWallet(): Promise<void> {
  await releaseExternalWalletConnection();
  await wagmiDisconnect(wagmiConfig);
}
