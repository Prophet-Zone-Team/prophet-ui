"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { usePrivy } from "@privy-io/react-auth";
import { getAccount, watchAccount } from "wagmi/actions";

import { wagmiConfig } from "@/context/rainbowkit/wagmi-config";
import {
  activatePrivyWallet,
  findPrivyEmbeddedWallet,
} from "@/context/privy/privy-wallet-bridge";
import { releaseExternalWalletConnection } from "@/lib/trading/wallet-disconnect";
import { AuthLoginMethod, useAuthStore } from "@/store/auth-store";
import { useConnectModal } from "@rainbow-me/rainbowkit";

export interface OpenConnectOptions {
  loginMethod?: AuthLoginMethod;
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

function resolveConnectedAddress(
  expectedAddress?: string,
  options?: { embeddedOnly?: boolean },
) {
  const account = getAccount(wagmiConfig);

  if (!account.isConnected || !account.address) {
    return undefined;
  }

  if (options?.embeddedOnly) {
    const embedded = findPrivyEmbeddedWallet(expectedAddress);

    if (!embedded || !addressesMatch(account.address, embedded.address)) {
      return undefined;
    }
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
  const { connectModalOpen, openConnectModal } = useConnectModal();
  const connectModalOpenRef = useRef(connectModalOpen);

  useEffect(() => {
    connectModalOpenRef.current = connectModalOpen;
  }, [connectModalOpen]);

  // const { connectWallet } = useConnectWallet({
  //   onError: (error) => {
  //     pendingErrorRef.current?.(
  //       new Error(
  //         typeof error === "string"
  //           ? `Wallet connection failed: ${error}`
  //           : "Wallet connection failed.",
  //       ),
  //     );
  //   },
  // });

  const openConnectAndWait = async (options?: OpenConnectOptions) => {
    const _loginMethod = options?.loginMethod ?? loginMethod;
    const isEmbeddedLogin =
      privyAuthenticated &&
      (_loginMethod === "email" || _loginMethod === "google");

    if (isEmbeddedLogin) {
      await releaseExternalWalletConnection(_loginMethod);
    }

    const existing = resolveConnectedAddress(options?.expectedAddress, {
      embeddedOnly: isEmbeddedLogin,
    });

    if (existing) {
      return existing;
    }

    if (options?.signal?.aborted) {
      throw new Error("Wallet connection was cancelled.");
    }

    // Embedded (email/google) wallets are created after Privy auth. Wait for
    // them to appear and set the wagmi active wallet — never open the
    // external-wallet picker in this flow.
    let activated;
    if (isEmbeddedLogin) {
      activated = await activatePrivyWallet(options?.expectedAddress, {
        preferEmbedded: true,
      }).catch(() => undefined);
    }

    if (!activated && !isEmbeddedLogin) {
      openConnectModal?.();
    } else if (!activated && isEmbeddedLogin) {
      throw new Error(
        "Your embedded wallet is still being created. Please try again in a moment.",
      );
    }

    return new Promise<string>((resolve, reject) => {
      const timeoutMs = 3_000;
      let settled = false;
      let timeoutId: number | undefined;
      let unwatch: (() => void) | undefined;

      const finish = (handler: () => void) => {
        if (settled) {
          return;
        }

        settled = true;

        if (timeoutId !== undefined) {
          window.clearInterval(timeoutId);
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

      timeoutId = window.setInterval(() => {
        if (connectModalOpenRef.current) {
          return;
        }
        finish(() => {
          reject(new Error("Connect cancelled"));
        });
      }, timeoutMs);

      const tryResolve = () => {
        const address = resolveConnectedAddress(options?.expectedAddress, {
          embeddedOnly: isEmbeddedLogin,
        });

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
  };

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
