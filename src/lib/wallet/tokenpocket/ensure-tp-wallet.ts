"use client";

import { TP_REDIRECT_STORAGE_KEY } from "@/lib/wallet/tokenpocket/constants";
import { getTpSdk } from "@/lib/wallet/tokenpocket/tp-sdk-client";

export type EnsureTpWalletResult = {
  alreadyActive: boolean;
  reloadPending: boolean;
};

function saveRedirectPath() {
  if (typeof window === "undefined") {
    return;
  }

  const pathname = window.location.pathname ?? "";
  const queryString = window.location.search ?? "";
  const redirectTo = `${pathname}${queryString}`;

  if (redirectTo) {
    localStorage.setItem(TP_REDIRECT_STORAGE_KEY, redirectTo);
  }
}

function buildSwitchError(blockchain: string) {
  return `Switch to the ${blockchain} wallet in TokenPocket to continue.`;
}

export async function ensureTpWallet(blockchain: string): Promise<EnsureTpWalletResult> {
  const tp = await getTpSdk();

  try {
    const current = await tp.getCurrentWallet();

    if (current.result === true && current.data?.blockchain === blockchain) {
      return { alreadyActive: true, reloadPending: false };
    }
  } catch {
    // Fall through to wallet switch attempt.
  }

  saveRedirectPath();

  try {
    const switched = await tp.getWallet({
      walletTypes: [blockchain],
      switch: true,
    });

    if (!switched.result) {
      throw new Error(buildSwitchError(blockchain));
    }

    return { alreadyActive: false, reloadPending: true };
  } catch (error) {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TP_REDIRECT_STORAGE_KEY);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(buildSwitchError(blockchain));
  }
}

export function clearTokenPocketRedirectPath() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TP_REDIRECT_STORAGE_KEY);
}
