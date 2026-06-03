"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useConnectWallet, usePrivy } from "@privy-io/react-auth";
import { getAccount, watchAccount } from "wagmi/actions";

import { wagmiConfig } from "@/context/rainbowkit/wagmi-config";
import { activatePrivyWallet } from "@/context/privy/privy-wallet-bridge";
import { useAuthStore } from "@/store/auth-store";

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

  console.log("resolveConnectedAddress account", account);

  if (!account.isConnected || !account.address) {
    return undefined;
  }

  if (expectedAddress && !addressesMatch(account.address, expectedAddress)) {
    return undefined;
  }

  return account.address;
}

export function RainbowConnectGate({ children }: { children: ReactNode }) {
  const pendingErrorRef = useRef<((error: Error) => void) | null>(null);
  const loginMethod = useAuthStore((state) => state.loginMethod);
  const { authenticated: privyAuthenticated } = usePrivy();

  const { connectWallet } = useConnectWallet({
    onError: (error) => {
      pendingErrorRef.current?.(
        new Error(
          typeof error === "string"
            ? `Wallet connection failed: ${error}`
            : "Wallet connection failed.",
        ),
      );
    },
  });

  const openConnectAndWait = useCallback(
    async (options?: OpenConnectOptions) => {
      const existing = resolveConnectedAddress(options?.expectedAddress);

      console.log("existing", existing);

      if (existing) {
        return existing;
      }

      if (options?.signal?.aborted) {
        throw new Error("Wallet connection was cancelled.");
      }

      const isEmbeddedLogin =
        privyAuthenticated &&
        (loginMethod === "email" || loginMethod === "google");

      console.log("loginMethod", loginMethod);

      // Embedded (email/google) wallets are created after Privy auth. Wait for
      // them to appear and set the wagmi active wallet — never open the
      // external-wallet picker in this flow.
      let activated;
      if ((loginMethod === "email" || loginMethod === "google")) {
        activated = await activatePrivyWallet(options?.expectedAddress).catch(
          () => undefined,
        );
      }

      if (!activated && !isEmbeddedLogin) {
        connectWallet();
      } else if (!activated && isEmbeddedLogin) {
        throw new Error(
          "Your embedded wallet is still being created. Please try again in a moment.",
        );
      }

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

          if (pendingErrorRef.current === onConnectError) {
            pendingErrorRef.current = null;
          }

          handler();
        };

        const onAbort = () => {
          finish(() => {
            reject(new Error("Wallet connection was cancelled."));
          });
        };

        const onConnectError = (error: Error) => {
          finish(() => {
            reject(error);
          });
        };

        pendingErrorRef.current = onConnectError;

        if (options?.signal) {
          options.signal.addEventListener("abort", onAbort);
        }

        timeoutId = window.setTimeout(() => {
          finish(() => {
            reject(new Error("Wallet connection timed out. Try again."));
          });
        }, timeoutMs);

        const tryResolve = () => {
          console.log("tryResolve");
          const address = resolveConnectedAddress(options?.expectedAddress);
          console.log("tryResolve address", address);

          if (address) {
            finish(() => {
              console.log("finish resolve", address);
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
    },
    [connectWallet, loginMethod, privyAuthenticated],
  );

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
