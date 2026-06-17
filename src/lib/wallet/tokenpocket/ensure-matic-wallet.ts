"use client";

import {
  TP_BLOCKCHAIN_POLYGON,
  TP_REDIRECT_STORAGE_KEY,
} from "@/lib/wallet/tokenpocket/constants";
import { getTpSdk } from "@/lib/wallet/tokenpocket/tp-sdk-client";

export type EnsureMaticWalletResult = {
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

export async function ensureMaticWallet(): Promise<EnsureMaticWalletResult> {
  const tp = await getTpSdk();

  try {
    const current = await tp.getCurrentWallet();

    if (current.result === true && current.data?.blockchain === TP_BLOCKCHAIN_POLYGON) {
      return { alreadyActive: true, reloadPending: false };
    }
  } catch {
    // Fall through to wallet switch attempt.
  }

  saveRedirectPath();

  try {
    const switched = await tp.getWallet({
      walletTypes: [TP_BLOCKCHAIN_POLYGON],
      switch: true,
    });

    if (!switched.result) {
      throw new Error("Switch to Polygon wallet in TokenPocket to continue.");
    }

    return { alreadyActive: false, reloadPending: true };
  } catch (error) {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TP_REDIRECT_STORAGE_KEY);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Switch to Polygon wallet in TokenPocket to continue.");
  }
}

export function clearTokenPocketRedirectPath() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TP_REDIRECT_STORAGE_KEY);
}
