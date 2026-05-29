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

import { privateFundingWagmiConfig } from "@/context/private-funding-wallet/wagmi-config";

export interface OpenPrivateFundingConnectOptions {
  expectedAddress?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface PrivateFundingConnectGateApi {
  openConnectAndWait: (options?: OpenPrivateFundingConnectOptions) => Promise<string>;
}

const PrivateFundingConnectGateContext = createContext<PrivateFundingConnectGateApi | null>(
  null,
);

let globalPrivateFundingConnectGate: PrivateFundingConnectGateApi | null = null;

export function getPrivateFundingConnectGate(): PrivateFundingConnectGateApi {
  if (!globalPrivateFundingConnectGate) {
    throw new Error("Private funding connect gate is not ready.");
  }

  return globalPrivateFundingConnectGate;
}

function addressesMatch(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}

function resolveConnectedAddress(expectedAddress?: string) {
  const account = getAccount(privateFundingWagmiConfig);

  if (!account.isConnected || !account.address) {
    return undefined;
  }

  if (expectedAddress && !addressesMatch(account.address, expectedAddress)) {
    return undefined;
  }

  return account.address;
}

export function PrivateFundingConnectGate({ children }: { children: ReactNode }) {
  const { openConnectModal } = useConnectModal();

  const openConnectAndWait = useCallback(async (options?: OpenPrivateFundingConnectOptions) => {
    const existing = resolveConnectedAddress(options?.expectedAddress);

    if (existing) {
      return existing;
    }

    if (options?.signal?.aborted) {
      throw new Error("Wallet connection was cancelled.");
    }

    if (!openConnectModal) {
      throw new Error("Funding wallet connect modal is not available.");
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

      unwatch = watchAccount(privateFundingWagmiConfig, {
        onChange() {
          tryResolve();
        },
      });

      tryResolve();
    });
  }, [openConnectModal]);

  useEffect(() => {
    const api: PrivateFundingConnectGateApi = { openConnectAndWait };
    globalPrivateFundingConnectGate = api;

    return () => {
      if (globalPrivateFundingConnectGate === api) {
        globalPrivateFundingConnectGate = null;
      }
    };
  }, [openConnectAndWait]);

  return (
    <PrivateFundingConnectGateContext.Provider value={{ openConnectAndWait }}>
      {children}
    </PrivateFundingConnectGateContext.Provider>
  );
}

export function usePrivateFundingConnectGate() {
  const context = useContext(PrivateFundingConnectGateContext);

  if (!context) {
    throw new Error("usePrivateFundingConnectGate must be used within PrivateFundingConnectGate.");
  }

  return context;
}
