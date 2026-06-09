"use client";

import { getAccount } from "wagmi/actions";
import type { Connector } from "wagmi";

import { wagmiConfig } from "@/context/rainbowkit/wagmi-config";
import { waitForWalletReady } from "@/lib/trading/wallet-connection-watch";
import { TRADING_CHAIN_ID } from "@/lib/trading/wallet-trading-chain";

const MOBILE_UA_PATTERN = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
const MOBILE_SIGNING_BUFFER_MS = 250;
const PAGE_VISIBLE_TIMEOUT_MS = 120_000;

export function isMobileUserAgent() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return MOBILE_UA_PATTERN.test(navigator.userAgent);
}

export async function prepareWalletSigning(options?: { chainId?: number }) {
  const chainId = options?.chainId ?? TRADING_CHAIN_ID;

  await waitForWalletReady();
  await waitForPageVisible();

  const connector = resolveLiveConnector(getAccount(wagmiConfig).connector);

  if (connector && typeof connector.getProvider === "function") {
    await connector.getProvider({ chainId });
  }

  if (isMobileUserAgent()) {
    await delay(MOBILE_SIGNING_BUFFER_MS);
  }
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

function waitForPageVisible(timeoutMs = PAGE_VISIBLE_TIMEOUT_MS): Promise<void> {
  if (typeof document === "undefined" || document.visibilityState === "visible") {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let timeoutId: number | undefined;

    const cleanup = () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      document.removeEventListener("visibilitychange", onVisibilityChange);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        cleanup();
        resolve();
      }
    };

    timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting to return to the browser."));
    }, timeoutMs);

    document.addEventListener("visibilitychange", onVisibilityChange);
  });
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
