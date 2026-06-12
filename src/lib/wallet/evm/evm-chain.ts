"use client";

import type { Chain } from "viem";
import { getAccount, reconnect, switchChain, watchAccount } from "wagmi/actions";

import { getFundingEvmChain } from "@/config/funding/evm-chains";
import { getFundingRpcUrl } from "@/config/funding/networks";
import { type WagmiChainId, wagmiConfig } from "@/context/rainbowkit/wagmi-config";
import {
  getEvmWalletClient,
  requestEvmWalletRpc,
} from "@/lib/wallet/evm/evm-adapter";
import {
  parseCaip2ChainId,
  resolveEvmSignerSource,
} from "@/lib/wallet/evm/signer-source";
import type { EnsureChainOptions } from "@/lib/wallet/types";

const DEFAULT_CHAIN_SYNC_TIMEOUT_MS = 10_000;
const CHAIN_SYNC_POLL_MS = 150;
const CHAIN_NOT_ADDED_ERROR_CODE = 4902;

export function isWagmiOnChain(chainId: number): boolean {
  return getAccount(wagmiConfig).chainId === chainId;
}

/** Synchronous chain check that understands both wagmi and Privy signers. */
export function isActiveWalletOnChain(
  walletAddress: string,
  chainId: number,
): boolean {
  try {
    const source = resolveEvmSignerSource(walletAddress);

    if (source.kind === "privy") {
      return parseCaip2ChainId(source.wallet.chainId) === chainId;
    }

    return source.chainId === chainId;
  } catch {
    return false;
  }
}

export async function isWalletOnChain(
  walletAddress: string,
  chainId: number,
): Promise<boolean> {
  if (isActiveWalletOnChain(walletAddress, chainId)) {
    return true;
  }

  const walletChainId = await readWalletChainId(walletAddress);

  return walletChainId === chainId;
}

export async function waitForWalletOnChain(
  walletAddress: string,
  chainId: number,
  options?: {
    timeoutMs?: number;
  },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_CHAIN_SYNC_TIMEOUT_MS;
  const source = resolveEvmSignerSource(walletAddress);

  if (source.kind === "privy") {
    if (parseCaip2ChainId(source.wallet.chainId) === chainId) {
      return;
    }

    await waitForWalletChainId(walletAddress, chainId, timeoutMs);
    return;
  }

  if (isWagmiOnChain(chainId)) {
    return;
  }

  await waitForWalletChainId(walletAddress, chainId, timeoutMs);
  await syncWagmiToChain(chainId);
  await waitForWagmiChain(chainId, timeoutMs);
}

export async function ensureEvmChain(
  walletAddress: string,
  chainId: number,
  options?: EnsureChainOptions,
): Promise<void> {
  options?.onChecking?.();

  if (isActiveWalletOnChain(walletAddress, chainId)) {
    return;
  }

  const targetChain = getViemChain(chainId);

  options?.onSwitching?.();

  const source = resolveEvmSignerSource(walletAddress);

  if (source.kind === "privy") {
    try {
      await source.wallet.switchChain(chainId);
    } catch (error) {
      if (isUserRejectedRequest(error)) {
        throw new Error(buildRejectionMessage(targetChain, chainId, options));
      }

      throw error;
    }
  } else {
    try {
      await switchChain(wagmiConfig, { chainId: chainId as WagmiChainId });
    } catch (error) {
      if (isUserRejectedRequest(error)) {
        throw new Error(buildRejectionMessage(targetChain, chainId, options));
      }

      const client = await getEvmWalletClient(walletAddress);

      try {
        await client.switchChain({ id: chainId });
      } catch (switchError) {
        if (isChainNotAddedError(switchError)) {
          await requestEvmWalletRpc(walletAddress, {
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: toChainIdHex(chainId),
                chainName: targetChain.name,
                nativeCurrency: targetChain.nativeCurrency,
                rpcUrls: [resolveRpcUrl(targetChain, chainId)],
                blockExplorerUrls: targetChain.blockExplorers?.default.url
                  ? [targetChain.blockExplorers.default.url]
                  : undefined,
              },
            ],
          });

          await client.switchChain({ id: chainId });
        } else {
          throw switchError;
        }
      }
    }
  }

  try {
    await waitForWalletOnChain(walletAddress, chainId);
  } catch {
    throw new Error(
      options?.timeoutMessage ??
        `Switch your wallet to ${targetChain.name} (chainId ${chainId}) before continuing.`,
    );
  }
}

function buildRejectionMessage(
  chain: Chain,
  chainId: number,
  options?: EnsureChainOptions,
): string {
  return (
    options?.rejectionMessage ??
    `Wallet network switch was rejected. Switch to ${chain.name} (chainId ${chainId}) to continue.`
  );
}

function getViemChain(chainId: number): Chain {
  const chain = getFundingEvmChain(chainId);

  if (!chain) {
    throw new Error(`No wallet chain configuration for chainId ${chainId}.`);
  }

  return chain;
}

function resolveRpcUrl(chain: Chain, chainId: number): string {
  try {
    return getFundingRpcUrl(chainId);
  } catch {
    return chain.rpcUrls.default.http[0];
  }
}

function toChainIdHex(chainId: number) {
  return `0x${chainId.toString(16)}`;
}

function isUserRejectedRequest(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    Number((error as { code?: unknown }).code) === 4001
  );
}

function isChainNotAddedError(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  const code = (error as { code?: unknown }).code;

  return code === CHAIN_NOT_ADDED_ERROR_CODE || code === "4902";
}

async function waitForWalletChainId(
  walletAddress: string,
  chainId: number,
  timeoutMs: number,
): Promise<void> {
  if ((await readWalletChainId(walletAddress)) === chainId) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let timeoutId: number | undefined;
    let pollId: number | undefined;

    const cleanup = () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      if (pollId !== undefined) {
        window.clearInterval(pollId);
      }
    };

    const finish = (result: "matched" | "timeout") => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();

      if (result === "matched") {
        resolve();
        return;
      }

      reject(new Error("Timed out waiting for the wallet network to update."));
    };

    const check = async () => {
      if ((await readWalletChainId(walletAddress)) === chainId) {
        finish("matched");
      }
    };

    void check();

    pollId = window.setInterval(() => {
      void check();
    }, CHAIN_SYNC_POLL_MS);

    timeoutId = window.setTimeout(() => {
      void check().finally(() => finish("timeout"));
    }, timeoutMs);
  });
}

async function syncWagmiToChain(chainId: number): Promise<void> {
  if (isWagmiOnChain(chainId)) {
    return;
  }

  try {
    await switchChain(wagmiConfig, { chainId: chainId as WagmiChainId });
  } catch {
    try {
      await reconnect(wagmiConfig);
    } catch {
      // Reconnect may be unavailable before the first wallet connection settles.
    }
  }
}

async function waitForWagmiChain(chainId: number, timeoutMs: number): Promise<void> {
  if (isWagmiOnChain(chainId)) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let timeoutId: number | undefined;
    let pollId: number | undefined;
    let unwatch: (() => void) | undefined;

    const cleanup = () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      if (pollId !== undefined) {
        window.clearInterval(pollId);
      }

      unwatch?.();
    };

    const finish = (result: "matched" | "timeout") => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();

      if (result === "matched") {
        resolve();
        return;
      }

      reject(new Error("Timed out waiting for wagmi to sync the wallet network."));
    };

    const check = () => {
      if (isWagmiOnChain(chainId)) {
        finish("matched");
      }
    };

    unwatch = watchAccount(wagmiConfig, {
      onChange() {
        check();
      },
    });

    check();

    pollId = window.setInterval(check, CHAIN_SYNC_POLL_MS);

    timeoutId = window.setTimeout(() => {
      check();
      finish("timeout");
    }, timeoutMs);
  });
}

async function readWalletChainId(walletAddress: string): Promise<number | undefined> {
  try {
    const result = await requestEvmWalletRpc(walletAddress, {
      method: "eth_chainId",
    });

    return parseChainId(result);
  } catch {
    return undefined;
  }
}

function parseChainId(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const parsed = Number.parseInt(value, value.startsWith("0x") ? 16 : 10);

  return Number.isFinite(parsed) ? parsed : undefined;
}
