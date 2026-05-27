"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { getAccount, watchAccount } from "wagmi/actions";

import { wagmiConfig } from "@/context/rainbowkit/wagmi-config";


export interface OpenConnectOptions {
  expectedAddress?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface ConnectGateApi {
  openConnectAndWait: (options?: OpenConnectOptions) => Promise<string>;
}

const ConnectGateContext = createContext<ConnectGateApi | null>(null);

let globalConnectGate: ConnectGateApi | null = null;

export function getConnectGate(): ConnectGateApi {
  if (!globalConnectGate) {
    throw new Error(
      "Wallet connect gate is not ready. Ensure RainbowConnectGate is mounted inside RainbowProvider.",
    );
  }

  return globalConnectGate;
}

function addressesMatch(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}

function resolveConnectedAddress(expectedAddress?: string) {
  const account = getAccount(wagmiConfig);

  if (!account.isConnected || !account.address) {
    return undefined;
  }

  if (expectedAddress && !addressesMatch(account.address, expectedAddress)) {
    return undefined;
  }

  return account.address;
}

export function RainbowConnectGate({ children }: { children: ReactNode }) {
  const { openConnectModal } = useConnectModal();

  const openConnectAndWait = useCallback(async (options?: OpenConnectOptions) => {
    const existing = resolveConnectedAddress(options?.expectedAddress);

    if (existing) {
      return existing;
    }

    if (options?.signal?.aborted) {
      throw new Error("Wallet connection was cancelled.");
    }

    if (!openConnectModal) {
      throw new Error("Wallet connect modal is not available.");
    }

    openConnectModal();

    return new Promise<string>((resolve, reject) => {
      const timeoutMs = options?.timeoutMs ?? 120_000;
      let settled = false;
      let timeoutId: number | undefined;
      let unwatch: (() => void) | undefined;

      const finish = (handler: () => void) => {
        if (settled) {
          return;
        }

        settled = true;

        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
        }

        unwatch?.();
        options?.signal?.removeEventListener("abort", onAbort);
        handler();
      };

      const onAbort = () => {
        finish(() => {
          reject(new Error("Wallet connection was cancelled."));
        });
      };

      if (options?.signal) {
        options.signal.addEventListener("abort", onAbort);
      }

      timeoutId = window.setTimeout(() => {
        finish(() => {
          reject(new Error("Wallet connection timed out. Try again."));
        });
      }, timeoutMs);

      const tryResolve = () => {
        const address = resolveConnectedAddress(options?.expectedAddress);

        if (address) {
          finish(() => {
            resolve(address);
          });
        }
      };

      unwatch = watchAccount(wagmiConfig, {
        onChange() {
          tryResolve();
        },
      });

      tryResolve();
    });
  }, [openConnectModal]);

  useEffect(() => {
    const api: ConnectGateApi = { openConnectAndWait };
    globalConnectGate = api;

    return () => {
      if (globalConnectGate === api) {
        globalConnectGate = null;
      }
    };
  }, [openConnectAndWait]);

  return (
    <ConnectGateContext.Provider value={{ openConnectAndWait }}>
      {children}
    </ConnectGateContext.Provider>
  );
}

export function useConnectGate() {
  const context = useContext(ConnectGateContext);

  if (!context) {
    throw new Error("useConnectGate must be used within RainbowConnectGate.");
  }

  return context;
}
