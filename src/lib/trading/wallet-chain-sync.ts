"use client";

import { requestWalletRpc } from "@/components/trading/wallet-provider";
import { type WagmiChainId, wagmiConfig } from "@/context/rainbowkit/wagmi-config";
import { getAccount, reconnect, switchChain, watchAccount } from "wagmi/actions";

const DEFAULT_CHAIN_SYNC_TIMEOUT_MS = 10_000;
const CHAIN_SYNC_POLL_MS = 150;

export function isWagmiOnChain(chainId: number): boolean {
  return getAccount(wagmiConfig).chainId === chainId;
}

export async function isWalletOnChain(
  walletAddress: string,
  chainId: number,
): Promise<boolean> {
  if (isWagmiOnChain(chainId)) {
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

  if (isWagmiOnChain(chainId)) {
    return;
  }

  await waitForWalletChainId(walletAddress, chainId, timeoutMs);
  await syncWagmiToChain(chainId);
  await waitForWagmiChain(chainId, timeoutMs);
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
    const result = await requestWalletRpc(walletAddress, {
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
