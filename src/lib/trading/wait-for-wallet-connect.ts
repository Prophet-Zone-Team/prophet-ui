"use client";

import { getAccount, watchAccount } from "wagmi/actions";

import { isInWalletInAppBrowser } from "@/context/rainbowkit/utils";
import { wagmiConfig } from "@/context/rainbowkit/wagmi-config";

const DEFAULT_TIMEOUT_MS = 30_000;
const MODAL_CLOSE_CANCEL_INTERVAL_MS = 3_000;

export interface WaitForExternalWalletConnectionOptions {
  expectedAddress?: string;
  timeoutMs?: number;
  cancelOnModalClose?: boolean;
  connectModalOpenRef?: { current: boolean };
  signal?: AbortSignal;
}

function addressesMatch(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}

function resolveConnectedAddress(expectedAddress?: string): string | undefined {
  const account = getAccount(wagmiConfig);

  if (!account.isConnected || !account.address) {
    return undefined;
  }

  if (expectedAddress && !addressesMatch(account.address, expectedAddress)) {
    return undefined;
  }

  return account.address;
}

export function waitForExternalWalletConnection(
  options?: WaitForExternalWalletConnectionOptions,
): Promise<string> {
  const existing = resolveConnectedAddress(options?.expectedAddress);

  if (existing) {
    return Promise.resolve(existing);
  }

  if (options?.signal?.aborted) {
    return Promise.reject(new Error("Wallet connection was cancelled."));
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const cancelOnModalClose =
    options?.cancelOnModalClose ??
    !isInWalletInAppBrowser();

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    let timeoutId: number | undefined;
    let modalCloseIntervalId: number | undefined;
    let unwatch: (() => void) | undefined;

    const finish = (handler: () => void) => {
      if (settled) {
        return;
      }

      settled = true;

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      if (modalCloseIntervalId !== undefined) {
        window.clearInterval(modalCloseIntervalId);
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

    const tryResolve = () => {
      const address = resolveConnectedAddress(options?.expectedAddress);

      if (address) {
        finish(() => {
          resolve(address);
        });
      }
    };

    if (options?.signal) {
      options.signal.addEventListener("abort", onAbort);
    }

    timeoutId = window.setTimeout(() => {
      finish(() => {
        reject(new Error("Connect timeout"));
      });
    }, timeoutMs);

    if (cancelOnModalClose && options?.connectModalOpenRef) {
      modalCloseIntervalId = window.setInterval(() => {
        if (options.connectModalOpenRef?.current) {
          return;
        }

        finish(() => {
          reject(new Error("Connect cancelled"));
        });
      }, MODAL_CLOSE_CANCEL_INTERVAL_MS);
    }

    unwatch = watchAccount(wagmiConfig, {
      onChange() {
        tryResolve();
      },
    });

    tryResolve();
  });
}
